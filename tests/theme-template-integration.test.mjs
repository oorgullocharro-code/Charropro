import assert from "node:assert/strict";
import {
  BroadcastThemeTemplateIntegrationError,
  THEME_TEMPLATE_INTEGRATION_ERROR_CODES,
  THEME_TEMPLATE_INTEGRATION_STATES,
  THEME_TEMPLATE_INTEGRATION_VERSION,
  applyThemeToComponentInstance,
  applyThemeToTemplatePreparation,
  buildThemeTemplateSnapshot,
  buildThemedTemplatePreparation,
  clearThemeTemplateIntegration,
  cloneThemedTemplateResult,
  createThemeTemplateIntegration,
  destroyThemeTemplateIntegration,
  getThemeTemplateWarnings,
  getThemedTemplateRender,
  listThemedTemplateRenders,
  removeThemedTemplateRender,
  renderThemedTemplate,
  resolveThemeForTemplate,
  updateThemedTemplateRender,
  validateThemeTemplateIntegrationContext,
  validateThemeTemplateSnapshot
} from "../js/broadcast/themeTemplateIntegration.js";
import {
  createProductionConsoleModel
} from "../js/broadcast/productionConsole.js";
import {
  createBroadcastTheme,
  getBroadcastTheme,
  publishBroadcastTheme,
  resolveBroadcastTheme
} from "../js/broadcast/themeEngine.js?v=20260714-theme-engine-001-theme-system-v1";
import {
  createTemplateRendererIntegration,
  destroyTemplateRendererIntegration,
  prepareTemplateRender
} from "../js/broadcast/templateRendererIntegration.js?v=20260714-template-renderer-integration-001-composed-preview-v1";
import {
  TEMPLATE_ENGINE_FIXTURE_TYPES,
  buildTemplateEngineFixture
} from "../fixtures/templateEngineFixtures.js";

class MockClassList {
  constructor(element) { this.element = element; }
  add(...names) {
    const current = new Set(String(this.element.className || "").split(/\s+/).filter(Boolean));
    names.forEach((name) => current.add(name));
    this.element.className = [...current].join(" ");
  }
  contains(name) { return String(this.element.className || "").split(/\s+/).includes(name); }
}

class MockElement {
  constructor(tagName, ownerDocument) {
    this.nodeType = 1;
    this.tagName = String(tagName).toUpperCase();
    this.namespaceURI = this.tagName === "SVG" ? "http://www.w3.org/2000/svg" : "http://www.w3.org/1999/xhtml";
    this.ownerDocument = ownerDocument;
    this.parentNode = null;
    this.children = [];
    this.style = {};
    this.className = "";
    this.classList = new MockClassList(this);
    this.attributes = new Map();
    this._textContent = "";
    this.isConnected = false;
    this.clientWidth = 960;
    this.clientHeight = 540;
  }
  appendChild(child) {
    if (child.parentNode) child.remove();
    child.parentNode = this;
    child.setConnected(this.isConnected);
    this.children.push(child);
    return child;
  }
  append(...children) { children.forEach((child) => this.appendChild(child)); }
  replaceChildren(...children) {
    this.children.forEach((child) => { child.parentNode = null; child.setConnected(false); });
    this.children = [];
    this._textContent = "";
    this.append(...children);
  }
  replaceWith(next) {
    if (!this.parentNode) return;
    const parent = this.parentNode;
    const index = parent.children.indexOf(this);
    this.parentNode = null;
    this.setConnected(false);
    next.parentNode = parent;
    next.setConnected(parent.isConnected);
    parent.children[index] = next;
  }
  remove() {
    if (!this.parentNode) return;
    const parent = this.parentNode;
    parent.children = parent.children.filter((child) => child !== this);
    this.parentNode = null;
    this.setConnected(false);
  }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.has(name) ? this.attributes.get(name) : null; }
  removeAttribute(name) { this.attributes.delete(name); }
  setConnected(value) {
    this.isConnected = value;
    this.children.forEach((child) => child.setConnected(value));
  }
  set textContent(value) {
    this.children.forEach((child) => { child.parentNode = null; child.setConnected(false); });
    this.children = [];
    this._textContent = String(value ?? "");
  }
  get textContent() { return this._textContent + this.children.map((child) => child.textContent).join(""); }
}

class MockDocument {
  constructor() {
    this.nodeType = 9;
    this.baseURI = "https://charropro.test/production-console.html";
    this.defaultView = { location: new URL(this.baseURI), HTMLElement: MockElement };
    this.body = new MockElement("body", this);
    this.body.isConnected = true;
  }
  createElement(tagName) { return new MockElement(tagName, this); }
}

const T0 = "2026-07-14T18:00:00.000Z";
const T1 = "2026-07-14T18:01:00.000Z";
const T2 = "2026-07-14T18:02:00.000Z";
const TENANT = "tenant_playground";
const ORGANIZATION = "organizacion_playground";
const TOURNAMENT = "torneo_playground";
const COMPETITION = "equipos_completo";
const OUTPUT = Object.freeze({
  id: "theme_template_preview",
  outputId: "theme_template_preview",
  type: "preview",
  width: 1920,
  height: 1080,
  orientation: "landscape",
  safeArea: { top: 54, right: 96, bottom: 54, left: 96 }
});

assert.equal(THEME_TEMPLATE_INTEGRATION_VERSION, "1.0.0");
assert.deepEqual(THEME_TEMPLATE_INTEGRATION_STATES, [
  "uninitialized", "ready", "resolving_theme", "theme_resolved", "preparing", "prepared",
  "rendering", "rendered", "updating", "partially_rendered", "cleared", "destroyed", "error"
]);
assert.equal(BroadcastThemeTemplateIntegrationError.prototype instanceof Error, true);
assert.equal(Object.keys(THEME_TEMPLATE_INTEGRATION_ERROR_CODES).length >= 16, true);

const model = createProductionConsoleModel({ now: T0 });
const document = new MockDocument();
const target = document.createElement("section");
document.body.appendChild(target);
const templateRenderer = createTemplateRendererIntegration(target, {
  integrationId: "theme_template_external_renderer",
  rendererId: "theme_template_component_renderer",
  outputId: OUTPUT.id,
  width: OUTPUT.width,
  height: OUTPUT.height,
  orientation: OUTPUT.orientation,
  safeArea: OUTPUT.safeArea,
  visibility: "production",
  tenantId: TENANT,
  now: T0
});

const baseContext = {
  themeRegistry: model.themeRegistry,
  templateRegistry: model.templateRegistry,
  componentRegistry: model.componentRegistry,
  templateRendererIntegration: templateRenderer,
  assetRegistry: model.assetRegistry,
  productionVariables: {},
  broadcastContract: {},
  output: OUTPUT,
  visibility: "production",
  tenantId: TENANT,
  organizationId: ORGANIZATION,
  clientId: "cliente_playground",
  tournamentId: TOURNAMENT,
  competitionId: COMPETITION,
  eventId: TOURNAMENT,
  sessionId: "session_theme_template_test"
};

assert.equal(validateThemeTemplateIntegrationContext(baseContext).valid, true);
assert.equal(validateThemeTemplateIntegrationContext({}).valid, false);
assert.equal(validateThemeTemplateIntegrationContext({ ...baseContext, output: { id: "wrong" } }).valid, false);

const integration = createThemeTemplateIntegration(baseContext, {
  integrationId: "theme_template_test",
  now: T0
});
assert.equal(integration.state, "ready");
assert.equal(integration.renderedIds.length, 0);

// Theme selection is explicit and deterministic, then follows the documented priority.
const explicit = resolveThemeForTemplate("theme_orgullo_charro", integration, { now: T0 });
assert.equal(explicit.themeId, "theme_orgullo_charro");
assert.equal(explicit.selectionReason, "explicit");
assert.equal(explicit.brandingStatus, "confirmed");
assert.deepEqual(resolveThemeForTemplate("theme_orgullo_charro", integration, { now: T0 }), explicit);

const priorityCases = [
  ["sessionThemeId", "theme_dark", "session-active"],
  ["outputThemeId", "theme_light", "output-active"],
  ["competitionThemeId", "theme_empresarial", "competition-active"],
  ["tournamentThemeId", "theme_rodeo", "tournament-active"],
  ["clientThemeId", "theme_liga_mexicana", "client-active"],
  ["organizationThemeId", "theme_orgullo_charro", "organization-active"],
  ["tenantThemeId", "theme_dark", "tenant-active"],
  ["globalThemeId", "theme_light", "global-active"]
];
for (const [field, themeId, reason] of priorityCases) {
  const localRenderer = createTemplateRendererIntegration(document.createElement("section"), {
    integrationId: `renderer_${field}`,
    outputId: OUTPUT.id,
    width: OUTPUT.width,
    height: OUTPUT.height,
    visibility: "production",
    tenantId: TENANT,
    allowDisconnected: true,
    now: T0
  });
  const local = createThemeTemplateIntegration({
    ...baseContext,
    templateRendererIntegration: localRenderer,
    themeSelections: { [field]: themeId }
  }, { integrationId: `integration_${field}`, now: T0 });
  const resolved = resolveThemeForTemplate({}, local, { now: T0 });
  assert.equal(resolved.themeId, themeId, field);
  assert.equal(resolved.selectionReason, reason, field);
  destroyThemeTemplateIntegration(local, { now: T1 });
  destroyTemplateRendererIntegration(localRenderer, { now: T1 });
}

const defaultRegistry = structuredClone(model.themeRegistry);
defaultRegistry.activeThemeId = null;
defaultRegistry.activeThemes = {};
const defaultRenderer = createTemplateRendererIntegration(document.createElement("section"), {
  integrationId: "renderer_default_fallback", outputId: OUTPUT.id, width: 1920, height: 1080,
  visibility: "production", tenantId: TENANT, allowDisconnected: true, now: T0
});
const defaultIntegration = createThemeTemplateIntegration({
  ...baseContext, themeRegistry: defaultRegistry, templateRendererIntegration: defaultRenderer, themeSelections: {}
}, { integrationId: "integration_default_fallback", now: T0 });
const defaultResolution = resolveThemeForTemplate({}, defaultIntegration, { now: T0 });
assert.equal(defaultResolution.themeId, "theme_default");
assert.equal(defaultResolution.selectionReason, "default");
assert.equal(defaultResolution.fallbackUsed, true);
destroyThemeTemplateIntegration(defaultIntegration, { now: T1 });
destroyTemplateRendererIntegration(defaultRenderer, { now: T1 });

function registryWithThemeStatus(status) {
  const registry = structuredClone(model.themeRegistry);
  const theme = registry.themes.theme_dark;
  theme.status = status;
  if (["draft", "error"].includes(status)) {
    theme.publishedAt = null;
    theme.publishedBy = null;
  }
  return registry;
}

const statusContext = (themeRegistry) => ({ ...baseContext, themeRegistry });
assert.equal(resolveThemeForTemplate("theme_dark", statusContext(registryWithThemeStatus("published"))).themeId, "theme_dark");
assert.equal(resolveThemeForTemplate("theme_dark", statusContext(registryWithThemeStatus("draft"))).themeId, "theme_dark");
assert.equal(resolveThemeForTemplate("theme_dark", statusContext(registryWithThemeStatus("inactive"))).themeId, "theme_dark");
assert.equal(resolveThemeForTemplate("theme_dark", statusContext(registryWithThemeStatus("deprecated"))).themeId, "theme_dark");
const automaticDraft = resolveThemeForTemplate(
  { sessionThemeId: "theme_dark" },
  statusContext(registryWithThemeStatus("draft"))
);
assert.notEqual(automaticDraft.themeId, "theme_dark");
const unpublishedActiveRegistry = registryWithThemeStatus("active");
unpublishedActiveRegistry.themes.theme_dark.publishedAt = null;
unpublishedActiveRegistry.themes.theme_dark.publishedBy = null;
const automaticUnpublishedActive = resolveThemeForTemplate(
  { sessionThemeId: "theme_dark" },
  statusContext(unpublishedActiveRegistry)
);
assert.notEqual(automaticUnpublishedActive.themeId, "theme_dark");
assert.throws(
  () => resolveThemeForTemplate("theme_dark", statusContext(registryWithThemeStatus("error"))),
  (error) => error.code === THEME_TEMPLATE_INTEGRATION_ERROR_CODES.THEME_STATUS_INVALID
);
const deletedThemeRegistry = structuredClone(model.themeRegistry);
delete deletedThemeRegistry.themes.theme_dark;
assert.throws(
  () => resolveThemeForTemplate("theme_dark", statusContext(deletedThemeRegistry)),
  (error) => error.code === THEME_TEMPLATE_INTEGRATION_ERROR_CODES.THEME_NOT_FOUND
);

// All official template types complete render, Theme update, snapshot and clear in isolation.
const broadcastStateBeforeAllTemplates = structuredClone(model.state);
for (const type of TEMPLATE_ENGINE_FIXTURE_TYPES) {
  const fixture = buildTemplateEngineFixture(type);
  const before = structuredClone(fixture);
  const fixtureTarget = document.createElement("section");
  document.body.appendChild(fixtureTarget);
  const fixtureRenderer = createTemplateRendererIntegration(fixtureTarget, {
    integrationId: `fixture_renderer_${type}`,
    outputId: OUTPUT.id,
    width: OUTPUT.width,
    height: OUTPUT.height,
    orientation: OUTPUT.orientation,
    safeArea: OUTPUT.safeArea,
    visibility: "production",
    tenantId: TENANT,
    now: T0
  });
  const fixtureIntegration = createThemeTemplateIntegration({
    ...baseContext,
    templateRendererIntegration: fixtureRenderer
  }, { integrationId: `fixture_integration_${type}`, now: T0 });
  const basePreparation = prepareTemplateRender(fixture.template, fixture.sources, {
    templateRenderId: `theme_template_fixture_${type}`,
    templateInstanceId: `theme_template_instance_${type}`,
    outputId: OUTPUT.id,
    outputType: "preview",
    width: OUTPUT.width,
    height: OUTPUT.height,
    orientation: OUTPUT.orientation,
    safeArea: OUTPUT.safeArea,
    visibility: "production",
    tenantId: TENANT,
    now: T0
  });
  const themed = buildThemedTemplatePreparation(basePreparation, explicit, fixtureIntegration, {
    now: T0,
    backgroundRole: type === "full_screen" ? "emphasis" : "panel"
  });
  assert.equal(themed.themeId, "theme_orgullo_charro", type);
  assert.equal(themed.components.length, fixture.template.components.length, type);
  assert.equal(themed.errors.length, 0, type);
  assert.deepEqual(themed.componentOrder, basePreparation.componentOrder, type);
  assert.deepEqual(themed.resolvedBindings, basePreparation.resolvedBindings, type);
  assert.deepEqual(fixture, before, type);
  const render = renderThemedTemplate(fixtureIntegration, themed, {
    themedRenderId: `fixture_themed_render_${type}`,
    includeRoot: true,
    now: T0
  });
  const renderedText = render.root.textContent;
  assert.equal(render.root.parentNode.children.filter((node) => node.classList.contains("cp-template-render-root")).length, 1, type);
  const changed = updateThemedTemplateRender(fixtureIntegration, render.themedRenderId, "theme_dark", {
    includeRoot: true,
    now: T1
  });
  assert.equal(changed.themeId, "theme_dark", type);
  assert.equal(changed.themedRenderId, render.themedRenderId, type);
  assert.equal(changed.templateRenderId, render.templateRenderId, type);
  assert.equal(changed.root, render.root, type);
  assert.equal(changed.root.textContent, renderedText, type);
  assert.equal(changed.root.parentNode.children.filter((node) => node.classList.contains("cp-template-render-root")).length, 1, type);
  const fixtureSnapshot = buildThemeTemplateSnapshot(fixtureIntegration, render.themedRenderId, {
    visibility: "production",
    now: T1
  });
  assert.equal(validateThemeTemplateSnapshot(fixtureSnapshot).valid, true, type);
  assert.equal(fixtureSnapshot.renders[0].themeId, "theme_dark", type);
  assert.equal(JSON.stringify(fixtureSnapshot).includes("basePreparation"), false, type);
  assert.equal(clearThemeTemplateIntegration(fixtureIntegration, { now: T2 }).cleared, true, type);
  assert.equal(render.root.isConnected, false, type);
  destroyThemeTemplateIntegration(fixtureIntegration, { now: T2 });
  destroyTemplateRendererIntegration(fixtureRenderer, { now: T2 });
  assert.deepEqual(fixture, before, type);
}
assert.deepEqual(model.state, broadcastStateBeforeAllTemplates);

// Token application changes only allowlisted appearance and preserves valid falsy values.
const lowerThirdFixture = buildTemplateEngineFixture("lower_third");
const lowerPreparation = prepareTemplateRender(lowerThirdFixture.template, lowerThirdFixture.sources, {
  templateRenderId: "theme_template_render_main",
  templateInstanceId: "theme_template_instance_main",
  outputId: OUTPUT.id,
  width: OUTPUT.width,
  height: OUTPUT.height,
  safeArea: OUTPUT.safeArea,
  visibility: "production",
  tenantId: TENANT,
  now: T0
});
const originalComponent = structuredClone(lowerPreparation.components[0].instance);
const themedComponent = applyThemeToComponentInstance(lowerPreparation.components[0].instance, explicit, {
  style: {
    color: "color.accent",
    backgroundColor: "color.surface",
    padding: "spacing.xs",
    margin: "spacing.xs",
    opacity: "color.unknown",
    unsupported: "color.primary"
  },
  componentStyleOverride: { borderWidth: 0, opacity: 0 }
}, { assetRegistry: model.assetRegistry, tenantId: TENANT, visibility: "production", now: T0 });
assert.equal(themedComponent.instance.style.color, explicit.resolvedTheme.colors.accent);
assert.equal(themedComponent.instance.style.borderWidth, 0);
assert.equal(themedComponent.instance.style.opacity, 0);
assert.equal(themedComponent.instance.style.margin.top, explicit.resolvedTheme.spacing.xs);
assert.equal(themedComponent.ignoredTokens.includes("color.unknown"), true);
assert.equal(themedComponent.ignoredTokens.includes("gap"), true);
assert.equal(themedComponent.ignoredTokens.includes("border.style"), true);
assert.equal(themedComponent.warnings.includes("component-style-property-unsupported"), true);
assert.deepEqual(lowerPreparation.components[0].instance, originalComponent);
assert.deepEqual(themedComponent.instance.bindings, originalComponent.bindings);
assert.deepEqual(themedComponent.instance.layout, originalComponent.layout);
assert.equal(themedComponent.instance.instanceId, originalComponent.instanceId);

// Theme requirements can warn or block without inventing tokens.
const requirementPreparation = structuredClone(lowerPreparation);
requirementPreparation.templateInstance.metadata = requirementPreparation.templateInstance.metadata || {};
requirementPreparation.templateInstance.metadata.themeTokensRequired = ["color.accent", "color.notAllowed"];
let requirementThemed = applyThemeToTemplatePreparation(requirementPreparation, explicit, {
  assetRegistry: model.assetRegistry, tenantId: TENANT, visibility: "production", now: T0
});
assert.equal(requirementThemed.warnings.some((warning) => warning.includes("color.notAllowed")), true);
requirementPreparation.templateInstance.metadata.themeRequirements = { strict: true };
requirementThemed = applyThemeToTemplatePreparation(requirementPreparation, explicit, {
  assetRegistry: model.assetRegistry, tenantId: TENANT, visibility: "production", now: T0
});
assert.equal(requirementThemed.errors.some((error) => error.includes("color.notAllowed")), true);

const variantPreparation = structuredClone(lowerPreparation);
variantPreparation.templateInstance.metadata = variantPreparation.templateInstance.metadata || {};
variantPreparation.templateInstance.metadata.themeVariant = "portrait";
const variantThemed = applyThemeToTemplatePreparation(variantPreparation, explicit, {
  assetRegistry: model.assetRegistry, tenantId: TENANT, visibility: "production", now: T0
});
assert.equal(variantThemed.warnings.includes("theme-variant-not-supported:portrait"), true);
assert.equal("appliedThemeVariant" in variantThemed, false);

// Safe gradients are generated from validated structured data only.
const orgulloGradient = buildThemedTemplatePreparation(lowerPreparation, explicit, integration, {
  backgroundRole: "emphasis", now: T0
});
assert.equal(orgulloGradient.themeBackground.type, "gradient");
assert.equal(orgulloGradient.themeBackground.value, "linear-gradient(90deg, #090A0C 0%, #174EA6 100%)");
const unsafeTheme = structuredClone(explicit);
unsafeTheme.resolvedTheme.backgrounds.program = { type: "gradient", angle: 0, stops: [{ color: "url(javascript:bad)", position: 0 }, { color: "#000", position: 1 }] };
const unsafeBackground = applyThemeToTemplatePreparation(lowerPreparation, unsafeTheme, { backgroundRole: "program", now: T0 });
assert.equal(unsafeBackground.errors.includes("theme-background-gradient-invalid"), true);

// Render and manual theme update delegate to the existing renderer, preserve one root and all data.
const themedPreparation = buildThemedTemplatePreparation(lowerPreparation, explicit, integration, { now: T0 });
const dataBeforeRender = structuredClone({
  bindings: lowerPreparation.resolvedBindings,
  components: lowerPreparation.components.map((component) => ({
    instanceId: component.instance.instanceId,
    bindings: component.instance.bindings,
    properties: component.instance.properties
  }))
});
const rendered = renderThemedTemplate(integration, themedPreparation, {
  themedRenderId: "themed_render_main",
  now: T0,
  includeRoot: true
});
assert.equal(["rendered", "partially_rendered"].includes(rendered.state), true);
assert.equal(rendered.themeId, "theme_orgullo_charro");
assert.equal(rendered.preparation.themeId, "theme_orgullo_charro");
assert.equal(rendered.preparation.templateId, rendered.templateId);
assert.equal(rendered.preparation.preparedAt, T0);
assert.doesNotMatch(JSON.stringify(rendered.preparation), /"(?:root|renderer|listener|runtime|signedUrl|token|secret)"\s*:/i);
assert.ok(rendered.root);
assert.equal(rendered.root.style.backgroundColor, "#090A0C");
const stableRoot = rendered.root;
assert.equal(listThemedTemplateRenders(integration).length, 1);
assert.equal(getThemedTemplateRender(integration, "themed_render_main").themeId, "theme_orgullo_charro");
const themeAPreparation = structuredClone(rendered.preparation);
rendered.preparation.components[0].instance.style.color = "#abcdef";
rendered.preparation.components[0].instance.properties.text = "mutated";
rendered.preparation.appliedTokens.push("mutated.token");
rendered.preparation.themeAssetRefs.push({ assetId: "mutated-asset", version: "1.0.0" });
assert.notEqual(getThemedTemplateRender(integration, "themed_render_main").preparation.components[0].instance.style.color, "#abcdef");
assert.notEqual(getThemedTemplateRender(integration, "themed_render_main").preparation.components[0].instance.properties.text, "mutated");
assert.equal(getThemedTemplateRender(integration, "themed_render_main").preparation.appliedTokens.includes("mutated.token"), false);
assert.equal(getThemedTemplateRender(integration, "themed_render_main").preparation.themeAssetRefs.some((asset) => asset.assetId === "mutated-asset"), false);

const gradientPreparation = structuredClone(orgulloGradient);
gradientPreparation.templateRenderId = "theme_template_gradient_visual";
const gradientRendered = renderThemedTemplate(integration, gradientPreparation, {
  themedRenderId: "themed_gradient_visual", now: T0, includeRoot: true
});
assert.equal(gradientRendered.root.style.backgroundImage, "linear-gradient(90deg, #090A0C 0%, #174EA6 100%)");
assert.equal(removeThemedTemplateRender(integration, "themed_gradient_visual", { now: T0 }).removed, true);

const updated = updateThemedTemplateRender(integration, "themed_render_main", "theme_dark", {
  now: T1,
  includeRoot: true
});
assert.equal(updated.themedRenderId, rendered.themedRenderId);
assert.equal(updated.templateRenderId, rendered.templateRenderId);
assert.equal(updated.themeId, "theme_dark");
assert.equal(updated.preparation.themeId, "theme_dark");
assert.equal(updated.preparation.templateId, updated.templateId);
assert.equal(updated.preparation.preparedAt, T1);
assert.notDeepEqual(updated.preparation.components[0].instance.style, themeAPreparation.components[0].instance.style);
assert.equal(themeAPreparation.themeId, "theme_orgullo_charro");
assert.equal(updated.root, stableRoot);
assert.equal(listThemedTemplateRenders(integration).length, 1);
assert.deepEqual({
  bindings: lowerPreparation.resolvedBindings,
  components: lowerPreparation.components.map((component) => ({
    instanceId: component.instance.instanceId,
    bindings: component.instance.bindings,
    properties: component.instance.properties
  }))
}, dataBeforeRender);

const lightUpdated = updateThemedTemplateRender(integration, "themed_render_main", "theme_light", { now: T2 });
assert.equal(lightUpdated.themeId, "theme_light");
assert.equal(lightUpdated.preparation.themeId, "theme_light");
assert.equal(lightUpdated.preparation.preparedAt, T2);
assert.notDeepEqual(lightUpdated.preparation.components[0].instance.style, updated.preparation.components[0].instance.style);
assert.equal(lightUpdated.createdAt, T0);
assert.equal(lightUpdated.updatedAt, T2);

// Theme updates restore the original Template styles and remove old appearance metadata.
const residueTarget = document.createElement("section");
document.body.appendChild(residueTarget);
const residueRenderer = createTemplateRendererIntegration(residueTarget, {
  integrationId: "renderer_theme_residue", outputId: OUTPUT.id, width: 1920, height: 1080,
  visibility: "production", tenantId: TENANT, now: T0
});
const residueIntegration = createThemeTemplateIntegration({
  ...baseContext,
  templateRendererIntegration: residueRenderer
}, { integrationId: "integration_theme_residue", now: T0 });
const themeWithAppearance = structuredClone(explicit);
themeWithAppearance.themeId = "theme_with_appearance";
themeWithAppearance.resolvedTheme.themeId = "theme_with_appearance";
themeWithAppearance.resolvedTheme.status = "published";
themeWithAppearance.resolvedTheme.colors = {
  textPrimary: "#112233", surface: "#223344", border: "#334455", background: "#010203"
};
themeWithAppearance.resolvedTheme.typography = {
  body: { family: "Inter", weight: 900, size: 48, lineHeight: 1.4, tracking: 2 }
};
themeWithAppearance.resolvedTheme.spacing = { sm: 18 };
themeWithAppearance.resolvedTheme.radius = { md: 12 };
themeWithAppearance.resolvedTheme.borders = { subtle: { width: 4, style: "solid", color: "#334455" } };
themeWithAppearance.resolvedTheme.shadows = {
  text: { x: 1, y: 2, blur: 8, spread: 0, color: "#000000", opacity: 1 },
  panel: { x: 2, y: 3, blur: 12, spread: 0, color: "#000000", opacity: 1 }
};
themeWithAppearance.resolvedTheme.backgrounds = {
  program: { type: "gradient", gradientType: "linear", angle: 45, stops: [
    { color: "#010203", position: 0 }, { color: "#112233", position: 1 }
  ] }
};
themeWithAppearance.resolvedTheme.logos = {};
themeWithAppearance.resolvedTheme.icons = {};
themeWithAppearance.resolvedTheme.watermarks = {};

const themeWithoutAppearance = structuredClone(themeWithAppearance);
themeWithoutAppearance.themeId = "theme_without_appearance";
themeWithoutAppearance.resolvedTheme.themeId = "theme_without_appearance";
themeWithoutAppearance.resolvedTheme.colors = {};
themeWithoutAppearance.resolvedTheme.typography = {};
themeWithoutAppearance.resolvedTheme.spacing = {};
themeWithoutAppearance.resolvedTheme.radius = {};
themeWithoutAppearance.resolvedTheme.borders = {};
themeWithoutAppearance.resolvedTheme.shadows = {};
themeWithoutAppearance.resolvedTheme.logos = {};
themeWithoutAppearance.resolvedTheme.icons = {};
themeWithoutAppearance.resolvedTheme.watermarks = {};
themeWithoutAppearance.resolvedTheme.backgrounds = { program: { type: "transparent" } };

const residuePreparation = structuredClone(lowerPreparation);
residuePreparation.preparationId = "residue_base_preparation";
residuePreparation.templateRenderId = "residue_template_render";
const residueOriginalStyle = structuredClone(residuePreparation.components[0].instance.style);
const residueThemed = buildThemedTemplatePreparation(residuePreparation, themeWithAppearance, residueIntegration, {
  backgroundRole: "program", now: T0
});
const residueRendered = renderThemedTemplate(residueIntegration, residueThemed, {
  themedRenderId: "themed_residue_render", includeRoot: true, now: T0
});
const residueComponentNode = residueRendered.root.children[0];
assert.notEqual(residueComponentNode.style.boxShadow, "");
assert.notEqual(residueRendered.root.style.backgroundImage, "");
const residueUpdated = updateThemedTemplateRender(
  residueIntegration,
  "themed_residue_render",
  themeWithoutAppearance,
  { includeRoot: true, backgroundRole: "program", now: T1 }
);
assert.equal(residueUpdated.root, residueRendered.root);
assert.equal(residueUpdated.root.children[0], residueComponentNode);
assert.equal(residueComponentNode.style.boxShadow, "");
assert.equal(residueComponentNode.style.color, residueOriginalStyle.color);
assert.equal(residueComponentNode.style.backgroundColor, residueOriginalStyle.backgroundColor);
assert.equal(residueComponentNode.style.borderWidth, `${residueOriginalStyle.borderWidth}px`);
assert.equal(residueComponentNode.style.fontSize, `${residueOriginalStyle.fontSize}px`);
assert.equal(residueUpdated.root.style.backgroundImage, "");
assert.equal(residueUpdated.root.style.backgroundColor, "transparent");

const cleanPreparation = applyThemeToTemplatePreparation(residuePreparation, themeWithoutAppearance, { now: T1 });
assert.equal(cleanPreparation.components[0].instance.metadata.themeApplication.appliedThemeId, "theme_without_appearance");
assert.equal(JSON.stringify(cleanPreparation).includes("theme_with_appearance"), false);
assert.deepEqual(cleanPreparation.components[0].instance.style, residueOriginalStyle);
assert.equal(clearThemeTemplateIntegration(residueIntegration, { now: T2 }).cleared, true);
destroyThemeTemplateIntegration(residueIntegration, { now: T2 });
destroyTemplateRendererIntegration(residueRenderer, { now: T2 });

// Snapshot is detached, visibility-aware and contains no runtime references.
const snapshot = buildThemeTemplateSnapshot(integration, "themed_render_main", { visibility: "production", now: T2 });
assert.equal(validateThemeTemplateSnapshot(snapshot).valid, true);
assert.equal(snapshot.renders[0].themeId, "theme_light");
assert.equal(snapshot.renders[0].preparation.themeId, "theme_light");
assert.deepEqual(snapshot.renders[0].preparation.components, lightUpdated.preparation.components);
const mismatchedPreparationSnapshot = structuredClone(snapshot);
mismatchedPreparationSnapshot.renders[0].preparation.themeId = "theme_dark";
assert.equal(validateThemeTemplateSnapshot(mismatchedPreparationSnapshot).valid, false);
assert.equal(
  validateThemeTemplateSnapshot(mismatchedPreparationSnapshot).errors.includes("theme-template-snapshot-preparation-theme-mismatch"),
  true
);
assert.equal("root" in snapshot.renders[0], false);
assert.equal(JSON.stringify(snapshot).includes("ownerDocument"), false);
const publicSnapshot = buildThemeTemplateSnapshot(integration, "themed_render_main", { visibility: "public", now: T2 });
assert.equal("tenantId" in publicSnapshot, false);
assert.equal(publicSnapshot.renders[0].preparation.themeId, "theme_light");
assert.equal(JSON.stringify(publicSnapshot.renders[0].preparation).includes(TENANT), false);
assert.equal(JSON.stringify(publicSnapshot).toLowerCase().includes("actor"), false);
const runtimeThemeBeforeMutation = getThemedTemplateRender(integration, "themed_render_main").themeId;
snapshot.renders[0].themeId = "mutated";
snapshot.renders[0].preparation.components[0].instance.style.color = "#123456";
assert.equal(getThemedTemplateRender(integration, "themed_render_main").themeId, runtimeThemeBeforeMutation);
assert.notEqual(getThemedTemplateRender(integration, "themed_render_main").preparation.components[0].instance.style.color, "#123456");
const cloned = cloneThemedTemplateResult(lightUpdated);
cloned.appliedTokens.push("mutated");
assert.equal(getThemedTemplateRender(integration, "themed_render_main").appliedTokens.includes("mutated"), false);

// Unsafe asset references and cross-tenant themes are rejected or safely ignored.
const forgedTheme = structuredClone(explicit);
forgedTheme.resolvedTheme.logos.tournament = { assetId: "asset-tournament-logo", url: "javascript:alert(1)" };
const logoFixture = buildTemplateEngineFixture("bug");
const logoPreparation = prepareTemplateRender(logoFixture.template, logoFixture.sources, {
  templateRenderId: "unsafe_asset_render", templateInstanceId: "unsafe_asset_instance",
  outputId: OUTPUT.id, width: 1920, height: 1080, visibility: "production", tenantId: TENANT, now: T0
});
const unsafeApplied = applyThemeToTemplatePreparation(logoPreparation, forgedTheme, {
  assetRegistry: model.assetRegistry, tenantId: TENANT, visibility: "production", now: T0
});
assert.equal(unsafeApplied.warnings.some((warning) => warning.includes("asset-reference-invalid")), true);
assert.deepEqual(unsafeApplied.components[0].instance.properties.assetRef, logoPreparation.components[0].instance.properties.assetRef);

const requiredAssetPreparation = structuredClone(lowerPreparation);
requiredAssetPreparation.templateInstance.metadata = requiredAssetPreparation.templateInstance.metadata || {};
requiredAssetPreparation.templateInstance.metadata.themeAssetsRequired = ["asset.logoPrimary"];
const requiredAssetResolution = structuredClone(explicit);
requiredAssetResolution.themeId = "theme_required_asset";
requiredAssetResolution.themeScope = "organization";
requiredAssetResolution.resolvedTheme.themeId = "theme_required_asset";
requiredAssetResolution.resolvedTheme.scope = "organization";
requiredAssetResolution.resolvedTheme.tenantId = TENANT;
requiredAssetResolution.resolvedTheme.organizationId = ORGANIZATION;
requiredAssetResolution.resolvedTheme.logos.tournament = {
  assetId: "asset-organization-logo",
  version: "1.0.0",
  variantId: "asset-organization-logo-original"
};
const requiredAssetOptions = {
  tenantId: TENANT,
  organizationId: ORGANIZATION,
  visibility: "production",
  now: T0
};
const applyRequiredAsset = (assetRegistry, resolution = requiredAssetResolution) => applyThemeToTemplatePreparation(
  requiredAssetPreparation,
  resolution,
  { ...requiredAssetOptions, assetRegistry }
);
assert.equal(applyRequiredAsset(model.assetRegistry).errors.includes("theme-required-asset-unavailable"), false);
const noAssetResolution = structuredClone(requiredAssetResolution);
noAssetResolution.themeId = "theme_without_assets";
noAssetResolution.resolvedTheme.themeId = "theme_without_assets";
noAssetResolution.resolvedTheme.logos = {};
const logoWithThemeAsset = applyThemeToTemplatePreparation(logoPreparation, requiredAssetResolution, {
  ...requiredAssetOptions,
  assetRegistry: model.assetRegistry
});
const logoWithoutThemeAsset = applyThemeToTemplatePreparation(logoPreparation, noAssetResolution, {
  ...requiredAssetOptions,
  assetRegistry: model.assetRegistry
});
assert.equal(logoWithThemeAsset.components[0].instance.properties.assetRef.assetId, "asset-organization-logo");
assert.deepEqual(
  logoWithoutThemeAsset.components[0].instance.properties.assetRef,
  logoPreparation.components[0].instance.properties.assetRef
);

const assetRegistryCase = (mutator) => {
  const registry = structuredClone(model.assetRegistry);
  const key = "asset-organization-logo@1.0.0";
  mutator(registry, registry.assets[key]);
  return registry;
};
const unavailableAssetCases = [
  assetRegistryCase((registry) => {
    delete registry.assets["asset-organization-logo@1.0.0"];
    delete registry.currentVersions["asset-organization-logo"];
  }),
  assetRegistryCase((registry, asset) => { asset.status = "expired"; }),
  assetRegistryCase((registry, asset) => { asset.status = "draft"; asset.publishedAt = null; }),
  assetRegistryCase((registry, asset) => {
    asset.tenantId = "tenant_other";
    asset.organizationId = "organization_other";
  }),
  assetRegistryCase((registry, asset) => {
    asset.fallbackVariantId = null;
    asset.fallbackStrategy = "none";
  })
];
const invalidVariantResolution = structuredClone(requiredAssetResolution);
invalidVariantResolution.resolvedTheme.logos.tournament.variantId = "variant_missing";
unavailableAssetCases.forEach((assetRegistry, index) => {
  const resolution = index === unavailableAssetCases.length - 1 ? invalidVariantResolution : requiredAssetResolution;
  assert.equal(applyRequiredAsset(assetRegistry, resolution).errors.includes("theme-required-asset-unavailable"), true, `required asset case ${index}`);
});

let tenantRegistry = createBroadcastTheme(model.themeRegistry, {
  themeId: "theme_tenant_a",
  name: "Tenant A",
  status: "draft",
  visibility: "production",
  scope: "tenant",
  tenantId: "tenant_a",
  baseThemeId: "theme_default",
  colors: { accent: "#123456" }
}, { actor: { id: "test" }, expectedRegistryRevision: model.themeRegistry.revision, now: T0 });
tenantRegistry = publishBroadcastTheme(tenantRegistry, "theme_tenant_a", {
  actor: { id: "test" }, expectedRegistryRevision: tenantRegistry.revision,
  expectedRevision: getBroadcastTheme(tenantRegistry, "theme_tenant_a").revision, now: T1
});
const tenantRenderer = createTemplateRendererIntegration(document.createElement("section"), {
  integrationId: "renderer_tenant_b", outputId: OUTPUT.id, width: 1920, height: 1080,
  visibility: "production", tenantId: "tenant_b", allowDisconnected: true, now: T0
});
const tenantIntegration = createThemeTemplateIntegration({
  ...baseContext, themeRegistry: tenantRegistry, templateRendererIntegration: tenantRenderer, tenantId: "tenant_b"
}, { integrationId: "integration_tenant_b", now: T0 });
assert.throws(
  () => resolveThemeForTemplate("theme_tenant_a", tenantIntegration, { now: T0 }),
  (error) => error.code === THEME_TEMPLATE_INTEGRATION_ERROR_CODES.THEME_SCOPE_MISMATCH
    || error.code === THEME_TEMPLATE_INTEGRATION_ERROR_CODES.TENANT_MISMATCH
);
destroyThemeTemplateIntegration(tenantIntegration, { now: T2 });
destroyTemplateRendererIntegration(tenantRenderer, { now: T2 });

// Visibility updates rebuild from the immutable base and remove non-public DOM content.
const visibilityTarget = document.createElement("section");
document.body.appendChild(visibilityTarget);
const visibilityRenderer = createTemplateRendererIntegration(visibilityTarget, {
  integrationId: "renderer_visibility_update", outputId: OUTPUT.id, width: 1920, height: 1080,
  visibility: "production", tenantId: TENANT, now: T0
});
const visibilityIntegration = createThemeTemplateIntegration({
  ...baseContext,
  templateRendererIntegration: visibilityRenderer
}, { integrationId: "integration_visibility_update", now: T0 });
const visibilityBase = structuredClone(lowerPreparation);
visibilityBase.preparationId = "visibility_base_preparation";
visibilityBase.templateRenderId = "visibility_template_render";
visibilityBase.templateInstance.visibility = "public";
const publicComponent = visibilityBase.components[0];
publicComponent.instance.visibility = "public";
publicComponent.instance.bindings.forEach((binding) => { binding.visibility = "public"; });
publicComponent.resolvedBindings["properties.text"] = "PUBLIC CONTENT";
const productionComponent = structuredClone(publicComponent);
productionComponent.instance.instanceId = `${publicComponent.instance.instanceId}_production`;
productionComponent.instance.visibility = "production";
productionComponent.instance.bindings.forEach((binding) => {
  binding.bindingId = `${binding.bindingId}_production`;
  binding.visibility = "production";
});
productionComponent.resolvedBindings["properties.text"] = "PRIVATE CONTENT";
productionComponent.declaredIndex = 1;
visibilityBase.components = [publicComponent, productionComponent];
visibilityBase.componentInstances = visibilityBase.components.map((component) => structuredClone(component.instance));
visibilityBase.componentOrder = visibilityBase.components.map((component) => component.instance.instanceId);
const visibilityThemed = buildThemedTemplatePreparation(visibilityBase, "theme_light", visibilityIntegration, {
  visibility: "production", now: T0
});
const visibilityRendered = renderThemedTemplate(visibilityIntegration, visibilityThemed, {
  themedRenderId: "themed_visibility_render", includeRoot: true, now: T0
});
assert.equal(visibilityRendered.componentCount, 2);
assert.equal(visibilityRendered.root.textContent.includes("PRIVATE CONTENT"), true);
const visibilityRoot = visibilityRendered.root;
const publicUpdated = updateThemedTemplateRender(visibilityIntegration, "themed_visibility_render", "theme_light", {
  visibility: "public", includeRoot: true, now: T1
});
assert.equal(publicUpdated.visibility, "public");
assert.equal(publicUpdated.componentCount, 1);
assert.equal(publicUpdated.preparation.themeId, "theme_light");
assert.equal(publicUpdated.preparation.components.length, 1);
assert.equal(JSON.stringify(publicUpdated.preparation).includes("tenant_playground"), false);
assert.equal(JSON.stringify(publicUpdated.preparation).includes("PRIVATE CONTENT"), false);
assert.equal(publicUpdated.root, visibilityRoot);
assert.equal(publicUpdated.root.textContent.includes("PUBLIC CONTENT"), true);
assert.equal(publicUpdated.root.textContent.includes("PRIVATE CONTENT"), false);
const publicVisibilitySnapshot = buildThemeTemplateSnapshot(visibilityIntegration, "themed_visibility_render", {
  visibility: "public", now: T1
});
assert.equal(JSON.stringify(publicVisibilitySnapshot).includes("tenant_playground"), false);
assert.equal(JSON.stringify(publicVisibilitySnapshot).includes("basePreparation"), false);

const productionRestored = updateThemedTemplateRender(visibilityIntegration, "themed_visibility_render", "theme_light", {
  visibility: "production", includeRoot: true, now: T2
});
assert.equal(productionRestored.componentCount, 2);
assert.equal(productionRestored.preparation.components.length, 2);
assert.equal(productionRestored.root, visibilityRoot);
assert.equal(productionRestored.root.textContent.includes("PRIVATE CONTENT"), true);

// A failed Theme change is atomic for wrapper state, render metadata, DOM and snapshot.
const atomicIntegrationBefore = structuredClone(visibilityIntegration);
const atomicRenderBefore = getThemedTemplateRender(visibilityIntegration, "themed_visibility_render");
const atomicSnapshotBefore = buildThemeTemplateSnapshot(visibilityIntegration, "themed_visibility_render", {
  visibility: "production", now: T2
});
const atomicDomBefore = {
  root: visibilityRoot,
  text: visibilityRoot.textContent,
  children: visibilityRoot.children.length,
  backgroundColor: visibilityRoot.style.backgroundColor,
  backgroundImage: visibilityRoot.style.backgroundImage
};
assert.throws(
  () => updateThemedTemplateRender(visibilityIntegration, "themed_visibility_render", "theme_missing", {
    visibility: "production", includeRoot: true, now: T2
  }),
  (error) => error.code === THEME_TEMPLATE_INTEGRATION_ERROR_CODES.THEME_NOT_FOUND
);
assert.deepEqual(visibilityIntegration, atomicIntegrationBefore);
assert.deepEqual(getThemedTemplateRender(visibilityIntegration, "themed_visibility_render"), atomicRenderBefore);
assert.deepEqual(buildThemeTemplateSnapshot(visibilityIntegration, "themed_visibility_render", {
  visibility: "production", now: T2
}), atomicSnapshotBefore);
assert.equal(visibilityRoot, atomicDomBefore.root);
assert.equal(visibilityRoot.textContent, atomicDomBefore.text);
assert.equal(visibilityRoot.children.length, atomicDomBefore.children);
assert.equal(visibilityRoot.style.backgroundColor, atomicDomBefore.backgroundColor);
assert.equal(visibilityRoot.style.backgroundImage, atomicDomBefore.backgroundImage);
assert.equal(clearThemeTemplateIntegration(visibilityIntegration, { now: T2 }).cleared, true);
destroyThemeTemplateIntegration(visibilityIntegration, { now: T2 });
destroyTemplateRendererIntegration(visibilityRenderer, { now: T2 });

// Scoreboard adaptations keep exactly three or four rows and do not recalculate values.
for (const count of [3, 4]) {
  const fixture = buildTemplateEngineFixture("ranking");
  const entries = Array.from({ length: count }, (_, index) => ({ position: index + 1, name: `Equipo ${index + 1}`, total: 300 - index }));
  fixture.sources.broadcastContract.ranking.entries = entries;
  const prepared = prepareTemplateRender(fixture.template, fixture.sources, {
    templateRenderId: `scoreboard_${count}`, templateInstanceId: `scoreboard_instance_${count}`,
    outputId: OUTPUT.id, width: 1920, height: 1080, visibility: "production", tenantId: TENANT, now: T0
  });
  assert.deepEqual(prepared.components[0].resolvedBindings["properties.entries"], entries);
  const themed = buildThemedTemplatePreparation(prepared, "theme_dark", integration, { now: T0 });
  assert.deepEqual(themed.components[0].resolvedBindings["properties.entries"], entries);
  assert.equal(themed.components[0].resolvedBindings["properties.entries"].length, count);
}

// Security cloning removes executable/non-serializable values without mutating sources.
const securitySource = structuredClone(lowerPreparation);
securitySource.templateInstance.metadata = securitySource.templateInstance.metadata || {};
securitySource.templateInstance.metadata.themeMappings = {
  [securitySource.components[0].instance.instanceId]: {
    style: { color: "color.primary" },
    plugin: () => "bad",
    script: "<script>alert(1)</script>"
  }
};
securitySource.templateInstance.metadata.safeFalsy = { zero: 0, no: false, empty: "", nil: null };
securitySource.templateInstance.metadata.cycle = securitySource.templateInstance.metadata;
const secured = buildThemedTemplatePreparation(securitySource, explicit, integration, { now: T0 });
assert.equal(secured.templateInstance.metadata.themeMappings[securitySource.components[0].instance.instanceId].plugin, undefined);
assert.equal(secured.templateInstance.metadata.themeMappings[securitySource.components[0].instance.instanceId].script, undefined);
assert.deepEqual(secured.templateInstance.metadata.safeFalsy, { zero: 0, no: false, empty: "", nil: null });

assert.equal(getThemeTemplateWarnings(integration).length >= 0, true);
assert.equal(removeThemedTemplateRender(integration, "missing").removed, false);
assert.equal(removeThemedTemplateRender(integration, "themed_render_main", { now: T2 }).removed, true);
assert.equal(removeThemedTemplateRender(integration, "themed_render_main", { now: T2 }).removed, false);
assert.equal(clearThemeTemplateIntegration(integration, { now: T2 }).cleared, true);
assert.equal(integration.state, "cleared");
destroyThemeTemplateIntegration(integration, { now: T2 });
assert.equal(integration.state, "destroyed");
const assertDestroyedOperation = (operation) => assert.throws(
  operation,
  (error) => error.code === "theme-template-integration-destroyed"
);
assertDestroyedOperation(() => resolveThemeForTemplate("theme_default", integration));
assertDestroyedOperation(() => buildThemedTemplatePreparation(lowerPreparation, explicit, integration));
assertDestroyedOperation(() => renderThemedTemplate(integration, themedPreparation));
assertDestroyedOperation(() => updateThemedTemplateRender(integration, "themed_render_main", "theme_dark"));
assertDestroyedOperation(() => removeThemedTemplateRender(integration, "themed_render_main"));
assertDestroyedOperation(() => clearThemeTemplateIntegration(integration));
assertDestroyedOperation(() => buildThemeTemplateSnapshot(integration));
destroyTemplateRendererIntegration(templateRenderer, { now: T2 });

console.log("theme-template-integration.test.mjs: OK");
