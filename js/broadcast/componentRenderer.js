import {
  COMPONENT_VISIBILITY,
  validateComponentInstance
} from "./componentLibrary.js?v=20260713-component-library-001-components-v1";

export const COMPONENT_RENDERER_VERSION = "1.0.0";

export const RENDERABLE_COMPONENT_TYPES = Object.freeze([
  "container", "text", "image", "logo", "icon", "rectangle", "line", "circle", "badge",
  "timer", "score", "ranking", "table", "list", "qr", "sponsor", "progress", "ticker"
]);

export const COMPONENT_RENDERER_STATES = Object.freeze([
  "uninitialized", "ready", "rendering", "rendered", "updating", "cleared", "destroyed", "error"
]);

export const COMPONENT_RENDERER_ERROR_CODES = Object.freeze({
  INVALID_TARGET: "component-renderer-target-invalid",
  INVALID_RENDERER: "component-renderer-invalid",
  DESTROYED: "component-renderer-destroyed",
  INVALID_INSTANCE: "component-renderer-instance-invalid",
  TYPE_UNSUPPORTED: "component-renderer-type-unsupported",
  RENDER_DUPLICATE: "component-renderer-render-id-duplicate",
  RENDER_NOT_FOUND: "component-renderer-render-not-found",
  NODE_CREATION_FAILED: "component-renderer-node-creation-failed",
  SNAPSHOT_INVALID: "component-renderer-snapshot-invalid"
});

const RENDERER_CONTEXTS = new WeakMap();
const VISIBILITY_RANK = Object.freeze({ public: 0, production: 1, operational: 2, restricted: 3 });
const HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
const FORBIDDEN_TARGET_TAGS = new Set(["IFRAME", "OBJECT", "EMBED", "SCRIPT", "SVG"]);
const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const FALLBACK_TYPES = new Set(["text", "placeholder", "asset", "hide", "empty", "error_badge"]);
const SAFE_TEXT_ALIGN = new Set(["left", "center", "right", "justify", "start", "end"]);
const SAFE_VERTICAL_ALIGN = new Set(["top", "middle", "bottom", "baseline"]);
const SAFE_OBJECT_FIT = new Set(["contain", "cover", "fill", "none", "scale-down"]);
const SAFE_OBJECT_POSITION = /^(?:left|right|center|top|bottom|\d{1,3}(?:\.\d+)?%)(?:\s+(?:left|right|center|top|bottom|\d{1,3}(?:\.\d+)?%))?$/;
const SAFE_LINE_STYLES = new Set(["solid", "dashed", "dotted"]);
const SAFE_DIRECTIONS = new Set(["row", "column"]);
const SAFE_ALIGNMENTS = new Set(["start", "center", "end", "stretch"]);
const SAFE_JUSTIFY = new Set(["start", "center", "end", "space-between", "space-around", "space-evenly"]);
const ICON_CATALOG = Object.freeze({
  asset_icon_star: "★",
  asset_icon_clock: "◷",
  asset_icon_score: "+",
  asset_icon_warning: "!",
  asset_icon_check: "✓"
});
const MAX_CHILDREN = 50;
const MAX_DEPTH = 8;
const MAX_ARRAY_ITEMS = 200;
const MAX_OBJECT_KEYS = 400;
const MAX_TEXT_LENGTH = 10000;
const STYLE_PROPERTIES = Object.freeze([
  "position", "left", "top", "width", "height", "transform", "transformOrigin", "zIndex", "overflow",
  "fontFamily", "fontSize", "fontWeight", "fontStyle", "textDecoration", "letterSpacing", "lineHeight",
  "color", "backgroundColor", "borderColor", "borderWidth", "borderStyle", "borderRadius", "opacity",
  "textAlign", "verticalAlign", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
  "marginTop", "marginRight", "marginBottom", "marginLeft", "boxShadow", "display", "flexDirection",
  "gap", "alignItems", "justifyContent", "whiteSpace", "textOverflow", "WebkitLineClamp", "WebkitBoxOrient",
  "listStyle", "objectFit", "objectPosition", "minWidth", "minHeight"
]);

export class BroadcastComponentRendererError extends Error {
  constructor(code, details = {}) {
    super(code);
    this.name = "BroadcastComponentRendererError";
    this.code = code;
    this.details = cloneSerializable(details) || {};
  }
}

export function validateComponentRenderTarget(target, options = {}) {
  const errors = [];
  const warnings = [];
  if (!target || typeof target !== "object" || target.nodeType !== 1) {
    errors.push(COMPONENT_RENDERER_ERROR_CODES.INVALID_TARGET);
    return validationResult(errors, warnings);
  }
  const tagName = String(target.tagName || "").toUpperCase();
  const namespace = target.namespaceURI || HTML_NAMESPACE;
  if (!tagName || FORBIDDEN_TARGET_TAGS.has(tagName) || namespace !== HTML_NAMESPACE) errors.push("component-renderer-target-type-forbidden");
  if (!target.ownerDocument || typeof target.ownerDocument.createElement !== "function") errors.push("component-renderer-target-document-invalid");
  if (typeof target.appendChild !== "function" || typeof target.replaceChildren !== "function") errors.push("component-renderer-target-api-invalid");
  if (target.isConnected === false && options.allowDisconnected !== true) errors.push("component-renderer-target-disconnected");
  if (target.ownerDocument?.nodeType !== undefined && target.ownerDocument.nodeType !== 9) errors.push("component-renderer-target-document-invalid");
  if (isCrossOriginTarget(target)) errors.push("component-renderer-target-cross-origin");
  return validationResult(errors, warnings);
}

export function createComponentRenderer(target, options = {}) {
  const targetValidation = validateComponentRenderTarget(target, options);
  if (!targetValidation.valid) throw rendererError(COMPONENT_RENDERER_ERROR_CODES.INVALID_TARGET, { errors: targetValidation.errors });
  const now = normalizeNow(options.now);
  const rendererId = normalizeId(options.rendererId) || buildId("renderer", now, options.random);
  const width = positiveInteger(options.width, 1920);
  const height = positiveInteger(options.height, 1080);
  const orientation = normalizeOrientation(options.orientation, width, height);
  const visibility = normalizeVisibility(options.visibility);
  const root = target.ownerDocument.createElement("div");
  root.className = "cp-component-renderer-root";
  safeSetAttribute(root, "data-renderer-id", rendererId);
  setStyle(root, "position", "absolute");
  setStyle(root, "left", "0");
  setStyle(root, "top", "0");
  setStyle(root, "width", "100%");
  setStyle(root, "height", "100%");
  setStyle(root, "overflow", "hidden");
  const canvas = target.ownerDocument.createElement("div");
  canvas.className = "cp-component-renderer-canvas";
  setStyle(canvas, "position", "absolute");
  setStyle(canvas, "left", "0");
  setStyle(canvas, "top", "0");
  setStyle(canvas, "width", `${width}px`);
  setStyle(canvas, "height", `${height}px`);
  setStyle(canvas, "transformOrigin", "top left");
  setStyle(canvas, "overflow", "hidden");
  root.appendChild(canvas);
  target.appendChild(root);

  const renderer = {
    rendererVersion: COMPONENT_RENDERER_VERSION,
    rendererId,
    outputId: normalizeId(options.outputId) || "preview",
    resolution: { width, height },
    orientation,
    safeArea: normalizeSafeArea(options.safeArea),
    visibility,
    debug: options.debug === true,
    state: "ready",
    createdAt: now,
    updatedAt: now,
    warnings: [],
    errors: []
  };
  const context = {
    target,
    root,
    canvas,
    document: target.ownerDocument,
    renders: new Map(),
    sequence: 0,
    state: "ready",
    resizeObserver: null
  };
  RENDERER_CONTEXTS.set(renderer, context);
  syncRendererViewport(renderer, context);
  const ResizeObserverClass = target.ownerDocument?.defaultView?.ResizeObserver;
  if (typeof ResizeObserverClass === "function") {
    context.resizeObserver = new ResizeObserverClass(() => syncRendererViewport(renderer, context));
    context.resizeObserver.observe(target);
  }
  return renderer;
}

export function destroyComponentRenderer(renderer, options = {}) {
  const context = RENDERER_CONTEXTS.get(renderer);
  if (!context) throw rendererError(COMPONENT_RENDERER_ERROR_CODES.INVALID_RENDERER);
  if (context.state === "destroyed") return renderer;
  clearRendererInternal(renderer, context, options);
  context.resizeObserver?.disconnect?.();
  context.resizeObserver = null;
  context.root?.remove?.();
  context.root = null;
  context.canvas = null;
  context.target = null;
  context.document = null;
  context.state = "destroyed";
  setRendererState(renderer, context, "destroyed", options.now);
  return renderer;
}

export function createComponentRenderNode(renderer, componentInstance, options = {}) {
  const context = requireRenderer(renderer);
  syncRendererViewport(renderer, context);
  const normalized = normalizeRenderInput(componentInstance, options);
  if (normalized.instance.componentType === "custom") throw rendererError(COMPONENT_RENDERER_ERROR_CODES.TYPE_UNSUPPORTED, { componentType: "custom" });
  const bundle = buildRenderNode(renderer, context, normalized.instance, normalized, 0, false);
  return bundle.node;
}

export function renderBroadcastComponent(renderer, componentInstance, options = {}) {
  const context = requireRenderer(renderer);
  syncRendererViewport(renderer, context);
  const now = normalizeNow(options.now);
  const normalized = normalizeRenderInput(componentInstance, options);
  if (normalized.instance.componentType === "custom") throw rendererError(COMPONENT_RENDERER_ERROR_CODES.TYPE_UNSUPPORTED, { componentType: "custom" });
  const renderId = normalizeId(options.renderId) || buildRenderId(context, normalized.instance, now);
  if (context.renders.has(renderId)) throw rendererError(COMPONENT_RENDERER_ERROR_CODES.RENDER_DUPLICATE, { renderId });
  setRendererState(renderer, context, "rendering", now);
  try {
    const visibilityBlocked = VISIBILITY_RANK[normalized.instance.visibility] > VISIBILITY_RANK[renderer.visibility];
    const disabled = ["disabled", "error"].includes(normalized.instance.status);
    const warnings = [...normalized.warnings];
    let node = null;
    if (visibilityBlocked) warnings.push("component-render-visibility-blocked");
    else if (disabled) warnings.push(`component-render-status-${normalized.instance.status}`);
    else {
      const bundle = buildRenderNode(renderer, context, normalized.instance, normalized, 0, false);
      node = bundle.node;
      warnings.push(...bundle.warnings);
      if (node) {
        safeSetAttribute(node, "data-render-id", renderId);
        context.canvas.appendChild(node);
      }
    }
    const result = createRenderResult(renderer, normalized.instance, renderId, node, now, uniqueStrings(warnings), []);
    context.renders.set(renderId, { result, instance: cloneSerializable(normalized.instance), options: cloneRenderOptions(normalized), node });
    setRendererState(renderer, context, "rendered", now);
    renderer.warnings = getComponentRenderWarnings(renderer);
    return cloneComponentRenderResult(result, { includeNode: true });
  } catch (error) {
    setRendererState(renderer, context, "error", now);
    renderer.errors = uniqueStrings([...(renderer.errors || []), error?.code || COMPONENT_RENDERER_ERROR_CODES.NODE_CREATION_FAILED]);
    throw error;
  }
}

export function updateBroadcastComponentRender(renderer, renderId, nextInstance, options = {}) {
  const context = requireRenderer(renderer);
  syncRendererViewport(renderer, context);
  const id = normalizeId(renderId);
  const current = context.renders.get(id);
  if (!current) throw rendererError(COMPONENT_RENDERER_ERROR_CODES.RENDER_NOT_FOUND, { renderId });
  const now = normalizeNow(options.now);
  const normalized = normalizeRenderInput(nextInstance, options);
  if (normalized.instance.componentType === "custom") throw rendererError(COMPONENT_RENDERER_ERROR_CODES.TYPE_UNSUPPORTED, { componentType: "custom" });
  setRendererState(renderer, context, "updating", now);
  try {
    const visibilityBlocked = VISIBILITY_RANK[normalized.instance.visibility] > VISIBILITY_RANK[renderer.visibility];
    const disabled = ["disabled", "error"].includes(normalized.instance.status);
    const warnings = [...normalized.warnings];
    let nextNode = null;
    if (visibilityBlocked) warnings.push("component-render-visibility-blocked");
    else if (disabled) warnings.push(`component-render-status-${normalized.instance.status}`);
    else if (current.node && current.instance.componentType === normalized.instance.componentType) {
      nextNode = current.node;
      populateRenderNode(renderer, context, nextNode, normalized.instance, normalized, 0, false);
    } else {
      const bundle = buildRenderNode(renderer, context, normalized.instance, normalized, 0, false);
      nextNode = bundle.node;
      warnings.push(...bundle.warnings);
      if (nextNode) safeSetAttribute(nextNode, "data-render-id", id);
    }
    warnings.push(...normalized.runtimeWarnings);

    if (current.node && current.node !== nextNode) {
      if (nextNode) current.node.replaceWith(nextNode);
      else current.node.remove?.();
    } else if (!current.node && nextNode) context.canvas.appendChild(nextNode);
    if (nextNode) safeSetAttribute(nextNode, "data-render-id", id);

    const result = {
      ...createRenderResult(renderer, normalized.instance, id, nextNode, current.result.createdAt, uniqueStrings(warnings), []),
      updatedAt: now
    };
    context.renders.set(id, { result, instance: cloneSerializable(normalized.instance), options: cloneRenderOptions(normalized), node: nextNode });
    setRendererState(renderer, context, "rendered", now);
    renderer.warnings = getComponentRenderWarnings(renderer);
    return cloneComponentRenderResult(result, { includeNode: true });
  } catch (error) {
    setRendererState(renderer, context, "error", now);
    renderer.errors = uniqueStrings([...(renderer.errors || []), error?.code || COMPONENT_RENDERER_ERROR_CODES.NODE_CREATION_FAILED]);
    throw error;
  }
}

export function removeBroadcastComponentRender(renderer, renderId, options = {}) {
  const context = requireRenderer(renderer);
  const id = normalizeId(renderId);
  const current = context.renders.get(id);
  if (!current) return { renderId: id, removed: false, status: "not_found" };
  current.node?.remove?.();
  context.renders.delete(id);
  const state = context.renders.size ? "rendered" : "cleared";
  setRendererState(renderer, context, state, options.now);
  renderer.warnings = getComponentRenderWarnings(renderer);
  return { renderId: id, removed: true, status: "removed" };
}

export function clearBroadcastComponentRenderer(renderer, options = {}) {
  const context = requireRenderer(renderer);
  const removedCount = clearRendererInternal(renderer, context, options);
  setRendererState(renderer, context, "cleared", options.now);
  return { rendererId: renderer.rendererId, cleared: true, removedCount, state: renderer.state };
}

export function getRenderedComponent(renderer, renderId, options = {}) {
  const context = requireRenderer(renderer);
  const record = context.renders.get(normalizeId(renderId));
  return record ? cloneComponentRenderResult(record.result, options) : null;
}

export function listRenderedComponents(renderer, options = {}) {
  const context = requireRenderer(renderer);
  return [...context.renders.values()].map((record) => cloneComponentRenderResult(record.result, options));
}

export function getComponentRenderWarnings(rendererOrInstance, options = {}) {
  const context = RENDERER_CONTEXTS.get(rendererOrInstance);
  if (context) {
    const recordWarnings = [...context.renders.values()].flatMap((record) => record.result.warnings || []);
    return uniqueStrings([...(rendererOrInstance.warnings || []), ...recordWarnings]);
  }
  if (!rendererOrInstance || typeof rendererOrInstance !== "object") return ["component-render-instance-missing"];
  const validation = validateComponentInstance(rendererOrInstance);
  const warnings = [...validation.warnings];
  if (!validation.valid) warnings.push(...validation.errors);
  if (rendererOrInstance.componentType === "custom") warnings.push(COMPONENT_RENDERER_ERROR_CODES.TYPE_UNSUPPORTED);
  if (rendererOrInstance.status === "deprecated") warnings.push("component-render-status-deprecated");
  if (rendererOrInstance.visibility && options.visibility
    && VISIBILITY_RANK[rendererOrInstance.visibility] > VISIBILITY_RANK[normalizeVisibility(options.visibility)]) warnings.push("component-render-visibility-blocked");
  return uniqueStrings(warnings);
}

export function cloneComponentRenderResult(result, options = {}) {
  if (!result || typeof result !== "object") return null;
  return {
    renderResultVersion: result.renderResultVersion,
    renderId: result.renderId,
    rendererId: result.rendererId,
    instanceId: result.instanceId,
    componentId: result.componentId,
    componentType: result.componentType,
    status: result.status,
    node: options.includeNode === true ? result.node || null : null,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
    outputId: result.outputId,
    warnings: uniqueStrings(result.warnings),
    errors: uniqueStrings(result.errors)
  };
}

export function buildComponentRenderSnapshot(renderer, options = {}) {
  const context = requireRenderer(renderer);
  const visibility = normalizeVisibility(options.visibility || renderer.visibility);
  const rank = VISIBILITY_RANK[visibility];
  const components = [...context.renders.values()]
    .filter((record) => VISIBILITY_RANK[record.instance.visibility] <= rank)
    .map((record) => ({
      renderId: record.result.renderId,
      instanceId: record.result.instanceId,
      componentId: record.result.componentId,
      componentType: record.result.componentType,
      status: record.result.status,
      visibility: record.instance.visibility,
      createdAt: record.result.createdAt,
      updatedAt: record.result.updatedAt,
      warnings: uniqueStrings(record.result.warnings),
      errors: uniqueStrings(record.result.errors)
    }));
  const snapshot = {
    snapshotVersion: COMPONENT_RENDERER_VERSION,
    rendererId: renderer.rendererId,
    outputId: renderer.outputId,
    resolution: cloneSerializable(renderer.resolution),
    orientation: renderer.orientation,
    safeArea: cloneSerializable(renderer.safeArea),
    visibility,
    state: renderer.state,
    renderIds: components.map((component) => component.renderId),
    components,
    warnings: uniqueStrings([...(renderer.warnings || []), ...components.flatMap((component) => component.warnings)]),
    errors: uniqueStrings([...(renderer.errors || []), ...components.flatMap((component) => component.errors)]),
    generatedAt: normalizeNow(options.now)
  };
  return cloneSerializable(snapshot);
}

export function validateComponentRenderSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object") return validationResult([COMPONENT_RENDERER_ERROR_CODES.SNAPSHOT_INVALID], []);
  const errors = [];
  if (snapshot.snapshotVersion !== COMPONENT_RENDERER_VERSION) errors.push("component-render-snapshot-version-invalid");
  if (!isSafeId(snapshot.rendererId) || !isSafeId(snapshot.outputId)) errors.push("component-render-snapshot-identity-invalid");
  if (!snapshot.resolution || !positiveInteger(snapshot.resolution.width, 0) || !positiveInteger(snapshot.resolution.height, 0)) errors.push("component-render-snapshot-resolution-invalid");
  if (!COMPONENT_RENDERER_STATES.includes(snapshot.state)) errors.push("component-render-snapshot-state-invalid");
  if (!COMPONENT_VISIBILITY.includes(snapshot.visibility)) errors.push("component-render-snapshot-visibility-invalid");
  if (!Array.isArray(snapshot.renderIds) || !Array.isArray(snapshot.components)) errors.push("component-render-snapshot-components-invalid");
  if (!Array.isArray(snapshot.warnings) || !Array.isArray(snapshot.errors)) errors.push("component-render-snapshot-diagnostics-invalid");
  if (!isIso(snapshot.generatedAt)) errors.push("component-render-snapshot-timestamp-invalid");
  if (containsRuntimeReference(snapshot)) errors.push("component-render-snapshot-runtime-reference-forbidden");
  return validationResult(errors, []);
}

function normalizeRenderInput(componentInstance, options) {
  const validation = validateComponentInstance(componentInstance);
  if (!validation.valid) throw rendererError(COMPONENT_RENDERER_ERROR_CODES.INVALID_INSTANCE, { errors: validation.errors });
  if (!RENDERABLE_COMPONENT_TYPES.includes(componentInstance.componentType) && componentInstance.componentType !== "custom") {
    throw rendererError(COMPONENT_RENDERER_ERROR_CODES.TYPE_UNSUPPORTED, { componentType: componentInstance.componentType });
  }
  const instance = cloneSerializable(componentInstance);
  const resolvedBindings = cloneSerializable(options.resolvedBindings || {});
  const resolvedContent = cloneSerializable(options.resolvedContent || {});
  const resolvedAssets = normalizeResolvedAssets(options.resolvedAssets);
  applyResolvedPropertyBindings(instance.properties, resolvedBindings);
  return {
    instance,
    resolvedBindings,
    resolvedContent,
    resolvedAssets,
    fallback: normalizeFallback(options.fallback || instance.metadata?.fallback),
    allowBlobAssets: options.allowBlobAssets === true,
    allowExternalAssets: options.allowExternalAssets === true,
    visible: options.visible !== false,
    runtimeHidden: false,
    runtimeWarnings: [],
    warnings: uniqueStrings([...(instance.warnings || []), ...validation.warnings])
  };
}

function buildRenderNode(renderer, context, instance, normalized, depth, nested) {
  const node = context.document.createElement("div");
  populateRenderNode(renderer, context, node, instance, normalized, depth, nested);
  return { node, warnings: uniqueStrings(normalized.runtimeWarnings) };
}

function populateRenderNode(renderer, context, node, instance, normalized, depth, nested) {
  if (depth > MAX_DEPTH) throw rendererError(COMPONENT_RENDERER_ERROR_CODES.NODE_CREATION_FAILED, { reason: "component-render-depth-exceeded" });
  node.replaceChildren();
  resetNode(node);
  node.className = `cp-component cp-component-${instance.componentType}`;
  safeSetAttribute(node, "data-component-type", instance.componentType);
  safeSetAttribute(node, "data-component-id", instance.componentId);
  safeSetAttribute(node, "data-instance-id", instance.instanceId);
  applyGeometry(node, instance.layout, renderer, nested);
  applySafeStyles(node, instance.style, normalized.resolvedContent);
  if (!normalized.visible) setStyle(node, "display", "none");
  const content = buildContentNode(renderer, context, instance, normalized, depth);
  if (content) node.appendChild(content);
  if (normalized.runtimeHidden) setStyle(node, "display", "none");
}

function buildContentNode(renderer, context, instance, normalized, depth) {
  const doc = context.document;
  const properties = instance.properties || {};
  const content = normalized.resolvedContent || {};
  if (instance.componentType === "container") return buildContainer(renderer, context, instance, normalized, depth);
  if (instance.componentType === "text") {
    const element = doc.createElement(properties.multiline ? "p" : "span");
    element.className = "cp-component-text-value";
    element.textContent = valueText(pick(content.text, properties.text), "");
    applyTextBehavior(element, properties);
    return element;
  }
  if (["image", "logo"].includes(instance.componentType)) {
    return buildImageNode(context, instance, normalized, instance.componentType);
  }
  if (instance.componentType === "icon") {
    const icon = doc.createElement("span");
    icon.className = "cp-component-icon-symbol";
    const iconId = properties.assetRef?.assetId || content.iconId;
    icon.textContent = ICON_CATALOG[iconId] || "?";
    safeSetAttribute(icon, "aria-label", valueText(content.label, "Icono"));
    return icon;
  }
  if (instance.componentType === "rectangle") {
    const rectangle = doc.createElement("div");
    rectangle.className = "cp-component-shape cp-component-rectangle-shape";
    return rectangle;
  }
  if (instance.componentType === "line") {
    const line = doc.createElement("div");
    line.className = `cp-component-shape cp-component-line-shape cp-component-line-${content.orientation === "vertical" ? "vertical" : "horizontal"}`;
    const thickness = clampFinite(content.thickness, 1, 20, 2);
    setStyle(line, content.orientation === "vertical" ? "width" : "height", `${thickness}px`);
    setStyle(line, content.orientation === "vertical" ? "height" : "width", "100%");
    setStyle(line, "borderStyle", SAFE_LINE_STYLES.has(content.lineStyle) ? content.lineStyle : "solid");
    return line;
  }
  if (instance.componentType === "circle") {
    const circle = doc.createElement("div");
    circle.className = "cp-component-shape cp-component-circle-shape";
    setStyle(circle, "borderRadius", "50%");
    return circle;
  }
  if (instance.componentType === "badge") return buildBadgeNode(doc, properties, content);
  if (instance.componentType === "timer") return buildMetricNode(doc, "timer", pick(content.label, "Tiempo"), pick(content.display, properties.display, properties.value), content.status);
  if (instance.componentType === "score") return buildMetricNode(doc, "score", pick(content.label, properties.label, "Calificación"), pick(content.value, properties.value), content.status);
  if (instance.componentType === "ranking") return buildRankingNode(doc, pick(content.entries, properties.entries), content.limit);
  if (instance.componentType === "table") return buildTableNode(doc, properties, content);
  if (instance.componentType === "list") return buildListNode(doc, properties, content);
  if (instance.componentType === "qr") return buildQrNode(doc, content);
  if (instance.componentType === "sponsor") return buildSponsorNode(context, instance, normalized);
  if (instance.componentType === "progress") return buildProgressNode(doc, properties, content);
  if (instance.componentType === "ticker") return buildTickerNode(doc, properties, content);
  return buildFallbackNode(context, normalized.fallback, "Componente no disponible", normalized);
}

function buildContainer(renderer, context, instance, normalized, depth) {
  const container = context.document.createElement("div");
  container.className = "cp-component-container-content";
  setStyle(container, "display", "flex");
  setStyle(container, "flexDirection", SAFE_DIRECTIONS.has(normalized.resolvedContent.direction) ? normalized.resolvedContent.direction : "column");
  setStyle(container, "gap", `${clampFinite(normalized.resolvedContent.gap, 0, 200, 8)}px`);
  setStyle(container, "alignItems", mapFlexValue(normalized.resolvedContent.align, SAFE_ALIGNMENTS, "stretch"));
  setStyle(container, "justifyContent", mapFlexValue(normalized.resolvedContent.justify, SAFE_JUSTIFY, "start"));
  setStyle(container, "overflow", normalized.resolvedContent.clipContent === true ? "hidden" : "visible");
  const children = Array.isArray(instance.properties?.children) ? instance.properties.children.slice(0, MAX_CHILDREN) : [];
  children.forEach((child) => {
    const validation = validateComponentInstance(child);
    if (!validation.valid || child.componentType === "custom") {
      container.appendChild(buildFallbackNode(context, { type: "error_badge", text: "Hijo inválido" }, "Hijo inválido", normalized));
      return;
    }
    const childNormalized = normalizeRenderInput(child, {});
    container.appendChild(buildRenderNode(renderer, context, childNormalized.instance, childNormalized, depth + 1, true).node);
  });
  return container;
}

function buildImageNode(context, instance, normalized, kind) {
  const assetRef = instance.properties?.assetRef || normalized.resolvedContent.assetRef;
  const resolved = resolveAuthorizedAssetUrl(assetRef, normalized.resolvedAssets, context.document, normalized);
  if (!resolved.valid) {
    normalized.runtimeWarnings.push(resolved.reason, "component-render-fallback-used");
    return buildFallbackNode(context, normalized.fallback, kind === "logo" ? "Logo no disponible" : "Imagen no disponible", normalized);
  }
  const image = context.document.createElement("img");
  image.className = `cp-component-${kind}-media`;
  safeSetAttribute(image, "src", resolved.url);
  safeSetAttribute(image, "alt", normalized.resolvedContent.decorative === true ? "" : valueText(normalized.resolvedContent.alt, kind === "logo" ? "Logo" : "Imagen"));
  setStyle(image, "objectFit", SAFE_OBJECT_FIT.has(normalized.resolvedContent.objectFit) ? normalized.resolvedContent.objectFit : "contain");
  setStyle(image, "objectPosition", SAFE_OBJECT_POSITION.test(String(normalized.resolvedContent.objectPosition || "center")) ? normalized.resolvedContent.objectPosition : "center");
  setStyle(image, "width", "100%");
  setStyle(image, "height", "100%");
  return image;
}

function buildBadgeNode(doc, properties, content) {
  const badge = doc.createElement("span");
  const variant = ["neutral", "success", "warning", "error", "live"].includes(content.variant) ? content.variant : "neutral";
  badge.className = `cp-component-badge-value cp-component-badge-${variant}`;
  const iconId = content.iconId;
  if (ICON_CATALOG[iconId]) {
    const icon = doc.createElement("span");
    icon.className = "cp-component-badge-icon";
    icon.textContent = ICON_CATALOG[iconId];
    badge.appendChild(icon);
  }
  const text = doc.createElement("span");
  text.textContent = valueText(pick(content.value, properties.value), "");
  badge.appendChild(text);
  return badge;
}

function buildMetricNode(doc, kind, labelValue, metricValue, status) {
  const wrapper = doc.createElement("div");
  wrapper.className = `cp-component-metric cp-component-${kind}-metric`;
  const label = doc.createElement("span");
  label.className = "cp-component-metric-label";
  label.textContent = valueText(labelValue, "");
  const value = doc.createElement("strong");
  value.className = "cp-component-metric-value";
  value.textContent = valueText(metricValue, "—");
  wrapper.appendChild(label);
  wrapper.appendChild(value);
  if (status !== null && status !== undefined) {
    const statusNode = doc.createElement("span");
    statusNode.className = "cp-component-metric-status";
    statusNode.textContent = valueText(status, "");
    wrapper.appendChild(statusNode);
  }
  return wrapper;
}

function buildRankingNode(doc, sourceEntries, limitValue) {
  const list = doc.createElement("ol");
  list.className = "cp-component-ranking-list";
  const entries = Array.isArray(sourceEntries) ? sourceEntries : [];
  const limit = boundedInteger(limitValue, 1, MAX_ARRAY_ITEMS, entries.length || MAX_ARRAY_ITEMS);
  entries.slice(0, limit).forEach((entry, index) => {
    const row = doc.createElement("li");
    row.className = entry?.highlight === true ? "cp-component-ranking-row is-highlighted" : "cp-component-ranking-row";
    const position = doc.createElement("span");
    position.className = "cp-component-ranking-position";
    position.textContent = valueText(entry?.position, index + 1);
    const name = doc.createElement("span");
    name.className = "cp-component-ranking-name";
    name.textContent = valueText(pick(entry?.name, entry?.teamName, entry?.participantName), "—");
    const value = doc.createElement("strong");
    value.className = "cp-component-ranking-value";
    value.textContent = valueText(pick(entry?.value, entry?.total, entry?.score), "—");
    row.appendChild(position);
    row.appendChild(name);
    row.appendChild(value);
    list.appendChild(row);
  });
  return list;
}

function buildTableNode(doc, properties, content) {
  const wrapper = doc.createElement("div");
  wrapper.className = "cp-component-table-wrap";
  const columns = Array.isArray(content.columns) ? content.columns : properties.columns || [];
  const rows = Array.isArray(content.rows) ? content.rows : properties.rows || [];
  const alignments = Array.isArray(content.alignments) ? content.alignments : properties.alignments || [];
  const rowLimit = boundedInteger(content.rowLimit, 1, MAX_ARRAY_ITEMS, rows.length || MAX_ARRAY_ITEMS);
  if (!rows.length && !columns.length) {
    const empty = doc.createElement("p");
    empty.className = "cp-component-empty";
    empty.textContent = valueText(content.emptyMessage, "Sin datos");
    wrapper.appendChild(empty);
    return wrapper;
  }
  const table = doc.createElement("table");
  table.className = "cp-component-table-element";
  if (columns.length) {
    const thead = doc.createElement("thead");
    const row = doc.createElement("tr");
    columns.forEach((column, index) => {
      const cell = doc.createElement("th");
      cell.textContent = valueText(column?.label ?? column, "");
      setStyle(cell, "textAlign", SAFE_TEXT_ALIGN.has(alignments[index]) ? alignments[index] : "left");
      row.appendChild(cell);
    });
    thead.appendChild(row);
    table.appendChild(thead);
  }
  const tbody = doc.createElement("tbody");
  rows.slice(0, rowLimit).forEach((rowValue) => {
    const row = doc.createElement("tr");
    const cells = Array.isArray(rowValue) ? rowValue : columns.map((column) => rowValue?.[column?.key ?? column]);
    cells.forEach((cellValue, index) => {
      const cell = doc.createElement("td");
      cell.textContent = valueText(cellValue, "—");
      setStyle(cell, "textAlign", SAFE_TEXT_ALIGN.has(alignments[index]) ? alignments[index] : "left");
      row.appendChild(cell);
    });
    tbody.appendChild(row);
  });
  table.appendChild(tbody);
  wrapper.appendChild(table);
  return wrapper;
}

function buildListNode(doc, properties, content) {
  const items = Array.isArray(content.items) ? content.items : properties.items || [];
  const ordered = content.ordered === true;
  const list = doc.createElement(ordered ? "ol" : "ul");
  list.className = "cp-component-list-items";
  if (content.bullet === false || properties.bullet === false) setStyle(list, "listStyle", "none");
  setStyle(list, "gap", `${clampFinite(pick(content.spacing, properties.spacing), 0, 100, 0)}px`);
  const limit = boundedInteger(content.limit, 1, MAX_ARRAY_ITEMS, items.length || MAX_ARRAY_ITEMS);
  if (!items.length) {
    const empty = doc.createElement("li");
    empty.className = "cp-component-empty";
    empty.textContent = valueText(content.emptyMessage, "Sin elementos");
    list.appendChild(empty);
    return list;
  }
  items.slice(0, limit).forEach((item) => {
    const row = doc.createElement("li");
    row.textContent = valueText(item?.label ?? item, "");
    list.appendChild(row);
  });
  return list;
}

function buildQrNode(doc, content) {
  const qr = doc.createElement("div");
  qr.className = "cp-component-qr-placeholder";
  const marker = doc.createElement("strong");
  marker.textContent = "QR";
  const label = doc.createElement("span");
  label.textContent = summarizeText(pick(content.label, content.value), "Contenido reservado", 48);
  const notice = doc.createElement("small");
  notice.textContent = "Placeholder técnico";
  qr.appendChild(marker);
  qr.appendChild(label);
  qr.appendChild(notice);
  return qr;
}

function buildSponsorNode(context, instance, normalized) {
  const wrapper = context.document.createElement("div");
  wrapper.className = "cp-component-sponsor-content";
  const media = buildImageNode(context, instance, normalized, "logo");
  if (media) wrapper.appendChild(media);
  const copy = context.document.createElement("div");
  copy.className = "cp-component-sponsor-copy";
  [normalized.resolvedContent.name, normalized.resolvedContent.campaign, normalized.resolvedContent.legal]
    .filter((value) => value !== null && value !== undefined)
    .forEach((value, index) => {
      const node = context.document.createElement(index === 0 ? "strong" : index === 1 ? "span" : "small");
      node.textContent = valueText(value, "");
      copy.appendChild(node);
    });
  wrapper.appendChild(copy);
  return wrapper;
}

function buildProgressNode(doc, properties, content) {
  const wrapper = doc.createElement("div");
  wrapper.className = `cp-component-progress cp-component-progress-${content.direction === "vertical" || properties.direction === "vertical" ? "vertical" : "horizontal"}`;
  const label = doc.createElement("span");
  label.className = "cp-component-progress-label";
  label.textContent = valueText(content.label, "");
  const track = doc.createElement("div");
  track.className = "cp-component-progress-track";
  const fill = doc.createElement("div");
  fill.className = "cp-component-progress-fill";
  const min = finiteNumber(content.min, 0);
  const max = finiteNumber(content.max, 100);
  const rawValue = finiteNumber(pick(content.value, properties.value), min);
  const percent = max > min ? clamp((rawValue - min) / (max - min), 0, 1) * 100 : 0;
  if (wrapper.className.includes("vertical")) setStyle(fill, "height", `${percent}%`);
  else setStyle(fill, "width", `${percent}%`);
  track.appendChild(fill);
  wrapper.appendChild(label);
  wrapper.appendChild(track);
  return wrapper;
}

function buildTickerNode(doc, properties, content) {
  const ticker = doc.createElement("div");
  ticker.className = "cp-component-ticker-static";
  const items = Array.isArray(content.items) ? content.items : properties.items || [];
  const separator = valueText(pick(content.separator, properties.separator), " · ");
  ticker.textContent = items.map((item) => valueText(item?.label ?? item, "")).join(separator);
  return ticker;
}

function buildFallbackNode(context, fallback, defaultText, normalized) {
  const selected = normalizeFallback(fallback) || { type: "placeholder" };
  normalized.runtimeWarnings.push(`component-render-fallback-${selected.type}`);
  if (selected.type === "hide") {
    normalized.runtimeHidden = true;
    return null;
  }
  const node = context.document.createElement("div");
  if (selected.type === "empty") {
    node.className = "cp-component-fallback-empty";
    safeSetAttribute(node, "aria-hidden", "true");
    return node;
  }
  if (selected.type === "asset") {
    const resolved = resolveAuthorizedAssetUrl(selected.assetRef, normalized.resolvedAssets, context.document, normalized);
    if (resolved.valid) {
      const image = context.document.createElement("img");
      image.className = "cp-component-fallback-asset";
      safeSetAttribute(image, "src", resolved.url);
      safeSetAttribute(image, "alt", valueText(selected.alt, "Recurso alterno"));
      return image;
    }
    normalized.runtimeWarnings.push(resolved.reason);
  }
  node.className = selected.type === "error_badge" ? "cp-component-fallback-error" : "cp-component-fallback-placeholder";
  node.textContent = valueText(selected.text, defaultText);
  return node;
}

function applyGeometry(node, layout = {}, renderer, nested) {
  const width = renderer.resolution.width;
  const height = renderer.resolution.height;
  const rendererSafe = renderer.safeArea;
  const componentSafe = normalizeSafeArea(layout.safeArea);
  const safe = {
    top: clamp(rendererSafe.top + componentSafe.top, 0, height / 2),
    right: clamp(rendererSafe.right + componentSafe.right, 0, width / 2),
    bottom: clamp(rendererSafe.bottom + componentSafe.bottom, 0, height / 2),
    left: clamp(rendererSafe.left + componentSafe.left, 0, width / 2)
  };
  const usableWidth = Math.max(1, width - safe.left - safe.right);
  const usableHeight = Math.max(1, height - safe.top - safe.bottom);
  const x = clampFinite(layout.x, 0, 1, 0);
  const y = clampFinite(layout.y, 0, 1, 0);
  const componentWidth = clampFinite(layout.width, 0, 1, 1);
  const componentHeight = clampFinite(layout.height, 0, 1, 1);
  const scale = clampFinite(layout.scale, 0.01, 20, 1);
  const rotation = clampFinite(layout.rotation, -360, 360, 0);
  const anchor = normalizeAnchor(layout.anchor);
  setStyle(node, "position", nested ? "relative" : "absolute");
  if (nested) {
    setStyle(node, "left", "0");
    setStyle(node, "top", "0");
  } else {
    setStyle(node, "left", `${((safe.left + (x * usableWidth)) / width) * 100}%`);
    setStyle(node, "top", `${((safe.top + (y * usableHeight)) / height) * 100}%`);
  }
  setStyle(node, "width", `${(componentWidth * usableWidth / width) * 100}%`);
  setStyle(node, "height", `${(componentHeight * usableHeight / height) * 100}%`);
  setStyle(node, "transform", `${anchorTransform(anchor)} rotate(${rotation}deg) scale(${scale})`);
  setStyle(node, "transformOrigin", anchorOrigin(anchor));
  setStyle(node, "zIndex", String(boundedInteger(layout.zIndex, -1000, 1000, 0)));
}

function applySafeStyles(node, style = {}, content = {}) {
  const fontFamily = safeFontFamily(style.fontFamily);
  if (fontFamily) setStyle(node, "fontFamily", fontFamily);
  if (Number.isFinite(style.fontSize)) setStyle(node, "fontSize", `${clamp(style.fontSize, 0, 500)}px`);
  if (["normal", "bold", "lighter", "bolder"].includes(style.fontWeight)) setStyle(node, "fontWeight", style.fontWeight);
  else if (Number.isInteger(style.fontWeight)) setStyle(node, "fontWeight", String(clamp(style.fontWeight, 100, 900)));
  setStyle(node, "fontStyle", style.italic === true ? "italic" : "normal");
  setStyle(node, "textDecoration", style.underline === true ? "underline" : "none");
  if (Number.isFinite(style.letterSpacing)) setStyle(node, "letterSpacing", `${clamp(style.letterSpacing, 0, 100)}px`);
  if (Number.isFinite(style.lineHeight)) setStyle(node, "lineHeight", String(clamp(style.lineHeight, 0, 20)));
  if (isSafeColor(style.color)) setStyle(node, "color", style.color);
  if (isSafeColor(style.backgroundColor)) setStyle(node, "backgroundColor", style.backgroundColor);
  if (isSafeColor(style.borderColor)) setStyle(node, "borderColor", style.borderColor);
  if (Number.isFinite(style.borderWidth)) setStyle(node, "borderWidth", `${clamp(style.borderWidth, 0, 100)}px`);
  setStyle(node, "borderStyle", "solid");
  if (Number.isFinite(style.borderRadius)) setStyle(node, "borderRadius", `${clamp(style.borderRadius, 0, 1000)}px`);
  setStyle(node, "opacity", String(clampFinite(style.opacity, 0, 1, 1)));
  if (SAFE_TEXT_ALIGN.has(style.textAlign)) setStyle(node, "textAlign", style.textAlign);
  if (SAFE_VERTICAL_ALIGN.has(style.verticalAlign)) setStyle(node, "verticalAlign", style.verticalAlign);
  applyBoxStyles(node, "padding", style.padding);
  applyBoxStyles(node, "margin", style.margin);
  if (style.shadow && isSafeColor(style.shadow.color)) {
    const shadow = `${clampFinite(style.shadow.x, -100, 100, 0)}px ${clampFinite(style.shadow.y, -100, 100, 0)}px ${clampFinite(style.shadow.blur, 0, 200, 0)}px ${clampFinite(style.shadow.spread, -100, 100, 0)}px ${style.shadow.color}`;
    setStyle(node, "boxShadow", shadow);
  }
  setStyle(node, "overflow", ["hidden", "visible", "auto"].includes(content.overflow) ? content.overflow : "hidden");
}

function applyTextBehavior(node, properties) {
  const transform = properties.textTransform;
  if (transform === "uppercase") node.textContent = node.textContent.toUpperCase();
  else if (transform === "lowercase") node.textContent = node.textContent.toLowerCase();
  else if (transform === "capitalize") node.textContent = node.textContent.replace(/\b\p{L}/gu, (letter) => letter.toUpperCase());
  if (properties.multiline) setStyle(node, "whiteSpace", "pre-wrap");
  else setStyle(node, "whiteSpace", "nowrap");
  if (properties.ellipsis) {
    setStyle(node, "textOverflow", "ellipsis");
    if (Number.isInteger(properties.maxLines) && properties.maxLines > 1) {
      setStyle(node, "display", "-webkit-box");
      setStyle(node, "WebkitLineClamp", String(properties.maxLines));
      setStyle(node, "WebkitBoxOrient", "vertical");
    }
  }
}

function resolveAuthorizedAssetUrl(assetRef, resolvedAssets, doc, options) {
  if (!assetRef?.assetId) return { valid: false, reason: "component-render-asset-ref-missing" };
  const asset = resolvedAssets[assetRef.assetId];
  if (!asset || asset.authorized !== true || !asset.url) return { valid: false, reason: "component-render-asset-not-authorized" };
  const raw = String(asset.url).trim();
  if (/^(?:javascript|file|data|vbscript):/i.test(raw)) return { valid: false, reason: "component-render-asset-protocol-forbidden" };
  if (raw.startsWith("blob:")) return options.allowBlobAssets && asset.blobAuthorized === true
    ? { valid: true, url: raw }
    : { valid: false, reason: "component-render-asset-blob-forbidden" };
  let url;
  try {
    url = new URL(raw, doc.baseURI || doc.defaultView?.location?.href || "http://localhost/");
  } catch {
    return { valid: false, reason: "component-render-asset-url-invalid" };
  }
  if (!["http:", "https:"].includes(url.protocol)) return { valid: false, reason: "component-render-asset-protocol-forbidden" };
  const origin = safeDocumentOrigin(doc);
  const sameOrigin = !origin || url.origin === origin;
  if (!sameOrigin && !(options.allowExternalAssets && asset.allowExternal === true)) return { valid: false, reason: "component-render-asset-cross-origin-forbidden" };
  if (raw.startsWith("//") && !sameOrigin) return { valid: false, reason: "component-render-asset-protocol-relative-forbidden" };
  return { valid: true, url: url.href };
}

function normalizeResolvedAssets(value) {
  const cloned = cloneSerializable(value);
  const source = Array.isArray(cloned) ? cloned : cloned && typeof cloned === "object" ? Object.values(cloned) : [];
  return Object.fromEntries(source.slice(0, MAX_ARRAY_ITEMS).map((asset) => {
    const safe = cloneSerializable(asset) || {};
    return [normalizeId(safe.assetId), {
      assetId: normalizeId(safe.assetId),
      url: typeof safe.url === "string" ? safe.url : null,
      authorized: safe.authorized === true,
      allowExternal: safe.allowExternal === true,
      blobAuthorized: safe.blobAuthorized === true
    }];
  }).filter(([assetId]) => assetId));
}

function normalizeFallback(value) {
  if (!value || typeof value !== "object" || !FALLBACK_TYPES.has(value.type)) return null;
  return {
    type: value.type,
    text: value.text === null || value.text === undefined ? null : summarizeText(value.text, "", 300),
    alt: value.alt === null || value.alt === undefined ? null : summarizeText(value.alt, "", 300),
    assetRef: value.assetRef && typeof value.assetRef === "object" ? {
      assetId: normalizeId(value.assetRef.assetId),
      version: value.assetRef.version || null,
      variantId: normalizeId(value.assetRef.variantId)
    } : null
  };
}

function applyResolvedPropertyBindings(properties, resolvedBindings) {
  if (!properties || typeof properties !== "object" || !resolvedBindings || typeof resolvedBindings !== "object") return;
  Object.entries(resolvedBindings).slice(0, MAX_OBJECT_KEYS).forEach(([path, value]) => {
    if (!/^properties\.[A-Za-z][A-Za-z0-9_-]*$/.test(path)) return;
    const key = path.slice("properties.".length);
    if (DANGEROUS_KEYS.has(key)) return;
    properties[key] = cloneSerializable(value);
  });
}

function createRenderResult(renderer, instance, renderId, node, createdAt, warnings, errors) {
  return {
    renderResultVersion: COMPONENT_RENDERER_VERSION,
    renderId,
    rendererId: renderer.rendererId,
    instanceId: instance.instanceId,
    componentId: instance.componentId,
    componentType: instance.componentType,
    status: "rendered",
    node: node || null,
    createdAt,
    updatedAt: createdAt,
    outputId: renderer.outputId,
    warnings,
    errors
  };
}

function syncRendererViewport(renderer, context) {
  if (!context?.canvas || !context?.target || context.state === "destroyed") return;
  const targetWidth = finiteNumber(context.target.clientWidth, 0);
  const targetHeight = finiteNumber(context.target.clientHeight, 0);
  const widthScale = targetWidth > 0 ? targetWidth / renderer.resolution.width : 1;
  const heightScale = targetHeight > 0 ? targetHeight / renderer.resolution.height : 1;
  const visualScale = Math.max(0.0001, Math.min(widthScale, heightScale));
  setStyle(context.canvas, "transform", `scale(${visualScale})`);
}

function clearRendererInternal(renderer, context, options) {
  const removedCount = context.renders.size;
  [...context.renders.values()].forEach((record) => record.node?.remove?.());
  context.renders.clear();
  renderer.warnings = [];
  renderer.errors = [];
  renderer.updatedAt = normalizeNow(options.now);
  return removedCount;
}

function requireRenderer(renderer) {
  const context = RENDERER_CONTEXTS.get(renderer);
  if (!context) throw rendererError(COMPONENT_RENDERER_ERROR_CODES.INVALID_RENDERER);
  if (context.state === "destroyed") throw rendererError(COMPONENT_RENDERER_ERROR_CODES.DESTROYED);
  return context;
}

function setRendererState(renderer, context, state, now) {
  if (!COMPONENT_RENDERER_STATES.includes(state)) throw rendererError(COMPONENT_RENDERER_ERROR_CODES.INVALID_RENDERER, { state });
  context.state = state;
  renderer.state = state;
  renderer.updatedAt = normalizeNow(now);
}

function buildRenderId(context, instance, now) {
  context.sequence += 1;
  return `render_${instance.componentType}_${Date.parse(now)}_${context.sequence}`;
}

function buildId(prefix, now, random) {
  const entropy = typeof random === "function" ? random() : Math.random();
  return `${prefix}_${Date.parse(now)}_${String(Math.floor(Math.abs(entropy) * 1e8)).padStart(8, "0")}`;
}

function resetNode(node) {
  STYLE_PROPERTIES.forEach((property) => setStyle(node, property, ""));
  ["data-component-type", "data-component-id", "data-instance-id", "data-render-id", "aria-label", "aria-hidden", "role", "alt", "src"]
    .forEach((attribute) => node.removeAttribute?.(attribute));
}

function setStyle(node, property, value) {
  if (!STYLE_PROPERTIES.includes(property) || !node?.style) return;
  node.style[property] = String(value ?? "");
}

function safeSetAttribute(node, name, value) {
  const allowed = new Set(["data-renderer-id", "data-render-id", "data-component-type", "data-component-id", "data-instance-id", "aria-label", "aria-hidden", "role", "alt", "src"]);
  if (!allowed.has(name) || typeof node?.setAttribute !== "function") return;
  node.setAttribute(name, String(value ?? ""));
}

function applyBoxStyles(node, prefix, value) {
  const box = normalizeSafeArea(value);
  setStyle(node, `${prefix}Top`, `${box.top}px`);
  setStyle(node, `${prefix}Right`, `${box.right}px`);
  setStyle(node, `${prefix}Bottom`, `${box.bottom}px`);
  setStyle(node, `${prefix}Left`, `${box.left}px`);
}

function cloneRenderOptions(normalized) {
  return {
    resolvedBindings: cloneSerializable(normalized.resolvedBindings),
    resolvedContent: cloneSerializable(normalized.resolvedContent),
    resolvedAssets: cloneSerializable(normalized.resolvedAssets),
    fallback: cloneSerializable(normalized.fallback),
    allowBlobAssets: normalized.allowBlobAssets,
    allowExternalAssets: normalized.allowExternalAssets,
    visible: normalized.visible
  };
}

function cloneSerializable(value, depth = 0, ancestors = new WeakSet()) {
  if (value === null || typeof value === "boolean") return value;
  if (typeof value === "string") return value.slice(0, MAX_TEXT_LENGTH);
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (["undefined", "function", "symbol", "bigint"].includes(typeof value)) return undefined;
  if (!value || typeof value !== "object" || depth > MAX_DEPTH || ancestors.has(value)) return undefined;
  if (isDomLike(value)) return undefined;
  ancestors.add(value);
  if (Array.isArray(value)) {
    const result = value.slice(0, MAX_ARRAY_ITEMS).map((item) => cloneSerializable(item, depth + 1, ancestors)).filter((item) => item !== undefined);
    ancestors.delete(value);
    return result;
  }
  const result = {};
  Object.entries(Object.getOwnPropertyDescriptors(value)).slice(0, MAX_OBJECT_KEYS).forEach(([key, descriptor]) => {
    if (DANGEROUS_KEYS.has(key) || !Object.hasOwn(descriptor, "value")) return;
    const child = cloneSerializable(descriptor.value, depth + 1, ancestors);
    if (child !== undefined) result[key] = child;
  });
  ancestors.delete(value);
  return result;
}

function containsRuntimeReference(value, depth = 0, ancestors = new WeakSet()) {
  if (!value || typeof value !== "object") return typeof value === "function" || typeof value === "symbol" || typeof value === "bigint";
  if (depth > MAX_DEPTH || ancestors.has(value) || isDomLike(value)) return true;
  ancestors.add(value);
  const invalid = Object.entries(value).some(([key, child]) => DANGEROUS_KEYS.has(key) || containsRuntimeReference(child, depth + 1, ancestors));
  ancestors.delete(value);
  return invalid;
}

function isDomLike(value) {
  return Boolean(value && typeof value === "object" && (value.nodeType || value.ownerDocument || value.window === value));
}

function isCrossOriginTarget(target) {
  try {
    const targetOrigin = target.ownerDocument?.defaultView?.location?.origin;
    const currentOrigin = globalThis.window?.location?.origin;
    return Boolean(targetOrigin && currentOrigin && targetOrigin !== currentOrigin);
  } catch {
    return true;
  }
}

function safeDocumentOrigin(doc) {
  try {
    return doc.defaultView?.location?.origin || (doc.baseURI ? new URL(doc.baseURI).origin : null);
  } catch {
    return null;
  }
}

function normalizeSafeArea(value) {
  if (Number.isFinite(value)) return { top: Math.max(0, value), right: Math.max(0, value), bottom: Math.max(0, value), left: Math.max(0, value), unit: "px" };
  const raw = value && typeof value === "object" ? value : {};
  return {
    top: Math.max(0, finiteNumber(raw.top, 0)),
    right: Math.max(0, finiteNumber(raw.right, 0)),
    bottom: Math.max(0, finiteNumber(raw.bottom, 0)),
    left: Math.max(0, finiteNumber(raw.left, 0)),
    unit: "px"
  };
}

function normalizeOrientation(value, width, height) {
  if (["landscape", "portrait", "panoramic"].includes(value)) return value;
  if (width / height > 3) return "panoramic";
  return height > width ? "portrait" : "landscape";
}

function normalizeVisibility(value) {
  return COMPONENT_VISIBILITY.includes(value) ? value : "production";
}

function normalizeAnchor(value) {
  return ["center", "top-left", "top-right", "bottom-left", "bottom-right"].includes(value) ? value : "center";
}

function anchorTransform(anchor) {
  if (anchor === "top-left") return "translate(0%, 0%)";
  if (anchor === "top-right") return "translate(-100%, 0%)";
  if (anchor === "bottom-left") return "translate(0%, -100%)";
  if (anchor === "bottom-right") return "translate(-100%, -100%)";
  return "translate(-50%, -50%)";
}

function anchorOrigin(anchor) {
  return { "top-left": "top left", "top-right": "top right", "bottom-left": "bottom left", "bottom-right": "bottom right" }[anchor] || "center";
}

function mapFlexValue(value, allowed, fallback) {
  const normalized = allowed.has(value) ? value : fallback;
  return { start: "flex-start", end: "flex-end" }[normalized] || normalized;
}

function safeFontFamily(value) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text || text.length > 200 || /(?:url\s*\(|expression\s*\(|@import|javascript:|data:|file:|[{};])/i.test(text)) return null;
  return /^[A-Za-z0-9\s,'"_-]+$/.test(text) ? text : null;
}

function isSafeColor(value) {
  return typeof value === "string" && /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(value);
}

function summarizeText(value, fallback, limit) {
  const text = value === null || value === undefined ? fallback : String(value);
  return text.length > limit ? `${text.slice(0, limit - 1)}…` : text;
}

function valueText(value, fallback) {
  return value === null || value === undefined ? fallback : String(value);
}

function pick(...values) {
  return values.find((value) => value !== undefined && value !== null);
}

function clampFinite(value, min, max, fallback) {
  return clamp(finiteNumber(value, fallback), min, max);
}

function finiteNumber(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

function positiveInteger(value, fallback) {
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

function boundedInteger(value, min, max, fallback) {
  return Number.isInteger(value) ? Math.round(clamp(value, min, max)) : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeId(value) {
  const id = String(value ?? "").trim();
  return isSafeId(id) ? id : null;
}

function isSafeId(value) {
  return typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/.test(value) && !DANGEROUS_KEYS.has(value) && !/^(?:javascript|data|file|vbscript):/i.test(value);
}

function normalizeNow(value) {
  if (typeof value === "function") return normalizeNow(value());
  if (typeof value === "string" && Number.isFinite(Date.parse(value))) return new Date(value).toISOString();
  return new Date().toISOString();
}

function isIso(value) {
  return typeof value === "string" && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
}

function uniqueStrings(value) {
  return [...new Set((Array.isArray(value) ? value : []).filter((item) => typeof item === "string" && item))];
}

function validationResult(errors, warnings) {
  return { valid: errors.length === 0, errors: uniqueStrings(errors), warnings: uniqueStrings(warnings), rendererVersion: COMPONENT_RENDERER_VERSION };
}

function rendererError(code, details = {}) {
  return new BroadcastComponentRendererError(code, details);
}
