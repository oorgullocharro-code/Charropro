import {
  buildComponentInstance,
  createBroadcastComponent
} from "../componentLibrary.js?v=20260713-component-library-001-components-v1";

export const COMPONENT_RENDERER_FIXTURE_VERSION = "1.0.0";

export const COMPONENT_RENDERER_FIXTURE_TYPES = Object.freeze([
  "text", "image", "logo", "icon", "container", "rectangle", "line", "circle", "badge",
  "timer", "score", "ranking", "table", "list", "qr", "sponsor", "progress", "ticker"
]);

export const COMPONENT_RENDERER_OUTPUTS = Object.freeze([
  Object.freeze({
    id: "component_16_9",
    label: "16:9 · 1920 x 1080",
    width: 1920,
    height: 1080,
    orientation: "landscape",
    safeArea: Object.freeze({ top: 54, right: 96, bottom: 54, left: 96, unit: "px" })
  }),
  Object.freeze({
    id: "component_vertical",
    label: "Vertical · 1080 x 1920",
    width: 1080,
    height: 1920,
    orientation: "portrait",
    safeArea: Object.freeze({ top: 80, right: 54, bottom: 120, left: 54, unit: "px" })
  }),
  Object.freeze({
    id: "component_led",
    label: "LED · 3840 x 720",
    width: 3840,
    height: 720,
    orientation: "panoramic",
    safeArea: Object.freeze({ top: 36, right: 160, bottom: 36, left: 160, unit: "px" })
  })
]);

const FIXTURE_NOW = "2026-07-14T12:00:00.000Z";
const ACTOR = Object.freeze({ id: "component_renderer_fixture", name: "Fixture de renderer", role: "production" });

export function getComponentRendererOutput(outputId) {
  const output = COMPONENT_RENDERER_OUTPUTS.find((candidate) => candidate.id === outputId) || COMPONENT_RENDERER_OUTPUTS[0];
  return clone(output);
}

export function buildComponentRendererFixture(type = "text", options = {}) {
  const fixtureType = COMPONENT_RENDERER_FIXTURE_TYPES.includes(type) ? type : "text";
  const now = options.now || FIXTURE_NOW;
  const variant = Number.isInteger(options.variant) ? options.variant : 0;
  const component = createBroadcastComponent(buildDefinition(fixtureType, variant), { now, actor: ACTOR });
  const instance = buildComponentInstance(component, {
    instanceId: `renderer_fixture_${fixtureType}_${variant + 1}`,
    instanceRevision: variant,
    metadata: { fixture: true, rendererFixtureType: fixtureType, variant }
  }, { now, actor: ACTOR });
  const resolvedContent = contentFor(fixtureType, variant);
  const resolvedAssets = {
    asset_renderer_logo: {
      assetId: "asset_renderer_logo",
      url: "/assets/obs/logo-och-dorado.png",
      authorized: true,
      allowExternal: false
    },
    asset_renderer_image: {
      assetId: "asset_renderer_image",
      url: "/assets/obs/barra.png",
      authorized: true,
      allowExternal: false
    },
    asset_icon_star: {
      assetId: "asset_icon_star",
      url: null,
      authorized: true,
      allowExternal: false
    }
  };
  return {
    fixtureVersion: COMPONENT_RENDERER_FIXTURE_VERSION,
    type: fixtureType,
    component,
    instance,
    resolvedBindings: {},
    resolvedContent,
    resolvedAssets,
    fallback: fallbackFor(fixtureType)
  };
}

function buildDefinition(type, variant) {
  const layout = layoutFor(type);
  return {
    componentId: `renderer_component_${type}`,
    name: `Fixture ${type}`,
    componentType: type,
    componentVersion: "1.0.0",
    componentRevision: 0,
    visibility: "production",
    status: "draft",
    bindings: [],
    style: styleFor(type),
    layout,
    animation: { type: "none", duration: 0, delay: 0, easing: "linear", repeat: 0, direction: "normal", trigger: "manual" },
    properties: propertiesFor(type, variant),
    metadata: { fixture: true, source: "component-renderer-fixtures" }
  };
}

function propertiesFor(type, variant) {
  if (type === "text") return { text: variant ? `Texto actualizado ${variant}` : "CharroPro Broadcast Studio", multiline: true, ellipsis: true, maxLines: 2, textTransform: "none" };
  if (type === "image") return { assetRef: { assetId: "asset_renderer_image", version: "1.0.0", variantId: "program" } };
  if (["logo", "sponsor"].includes(type)) return { assetRef: { assetId: "asset_renderer_logo", version: "1.0.0", variantId: "program" } };
  if (type === "icon") return { assetRef: { assetId: "asset_icon_star", version: "1.0.0", variantId: null } };
  if (type === "timer") return { value: 34200, display: variant ? "00:35.4" : "00:34.2", format: "mm:ss.d" };
  if (type === "score") return { label: "Calificación", value: variant ? 43 : 42 };
  if (type === "ranking") return { entries: rankingEntries() };
  if (type === "table") return { columns: ["Equipo", "Total"], rows: [["Rancho El Laurel", 318], ["Tres Regalos", 311], ["Hacienda de Guadalupe", 304]], alignments: ["left", "right"] };
  if (type === "list") return { items: ["Cala de Caballo", "Piales", "Colas"], spacing: 8, bullet: true };
  if (type === "qr") return { assetRef: null };
  if (type === "progress") return { value: variant ? 72 : 64, direction: "horizontal" };
  if (type === "ticker") return { items: ["Final por equipos", "Siguiente: Piales", "Resultados oficiales"], separator: " · " };
  if (type === "container") {
    const childText = createBroadcastComponent(buildDefinition("text", variant), { now: FIXTURE_NOW, actor: ACTOR });
    const childBadge = createBroadcastComponent(buildDefinition("badge", variant), { now: FIXTURE_NOW, actor: ACTOR });
    return {
      children: [
        buildComponentInstance(childText, { instanceId: `renderer_child_text_${variant + 1}`, layout: { x: 0, y: 0, width: 1, height: 0.5, anchor: "top-left", scale: 1, zIndex: 1 } }, { now: FIXTURE_NOW, actor: ACTOR }),
        buildComponentInstance(childBadge, { instanceId: `renderer_child_badge_${variant + 1}`, layout: { x: 0, y: 0, width: 0.5, height: 0.35, anchor: "top-left", scale: 1, zIndex: 2 } }, { now: FIXTURE_NOW, actor: ACTOR })
      ]
    };
  }
  if (type === "badge") return { value: variant ? "ACTUALIZADO" : "EN VIVO" };
  return { variant };
}

function contentFor(type, variant) {
  if (type === "image") return { alt: "Franja visual de CharroPro", objectFit: "cover", objectPosition: "center" };
  if (type === "logo") return { alt: "Logo de Orgullo Charro", objectFit: "contain", objectPosition: "center" };
  if (type === "icon") return { iconId: "asset_icon_star", label: "Destacado" };
  if (type === "container") return { direction: "column", gap: 18, align: "stretch", justify: "center", clipContent: true };
  if (type === "line") return { orientation: "horizontal", thickness: 4, lineStyle: "solid" };
  if (type === "badge") return { value: variant ? "ACTUALIZADO" : "EN VIVO", variant: "live", iconId: "asset_icon_star" };
  if (type === "timer") return { label: "Tiempo oficial", display: variant ? "00:35.4" : "00:34.2", status: "running", milliseconds: true, countDirection: "up" };
  if (type === "score") return { label: "Cala de Caballo", value: variant ? 43 : 42, status: "published", format: "points" };
  if (type === "ranking") return { entries: rankingEntries(), limit: 4 };
  if (type === "table") return { rowLimit: 3, emptyMessage: "Sin resultados" };
  if (type === "list") return { ordered: false, bullet: true, limit: 3, emptyMessage: "Sin elementos" };
  if (type === "qr") return { label: "Enlace público del torneo", value: "https://charropro.test/evento/final" };
  if (type === "sponsor") return { name: "Orgullo Charro", campaign: "Final Nacional", legal: "Marca de demostración", alt: "Logo del patrocinador", objectFit: "contain" };
  if (type === "progress") return { label: "Avance de la competencia", value: variant ? 72 : 64, min: 0, max: 100, direction: "horizontal" };
  if (type === "ticker") return { items: ["Final por equipos", "Siguiente: Piales", variant ? "Marcador actualizado" : "Resultados oficiales"], separator: " · " };
  if (type === "rectangle") return { overflow: "hidden" };
  return {};
}

function fallbackFor(type) {
  if (["image", "logo", "sponsor"].includes(type)) return { type: "placeholder", text: "Recurso no disponible" };
  return { type: "text", text: `${type} no disponible` };
}

function styleFor(type) {
  const shape = ["rectangle", "line", "circle"].includes(type);
  return {
    fontFamily: "Inter",
    fontSize: ["score", "timer"].includes(type) ? 72 : type === "ticker" ? 30 : 34,
    fontWeight: 700,
    italic: false,
    underline: false,
    letterSpacing: 0,
    lineHeight: 1.15,
    color: "#f4f5f7",
    backgroundColor: shape ? "#d6ad43" : type === "container" ? "#171a1f" : "#121418",
    borderColor: "#d6ad43",
    borderWidth: type === "line" ? 0 : 2,
    borderRadius: type === "circle" ? 999 : 8,
    opacity: 1,
    shadow: { x: 0, y: 8, blur: 24, spread: 0, color: "#000000" },
    textAlign: "left",
    verticalAlign: "middle",
    padding: shape ? 0 : 22,
    margin: 0
  };
}

function layoutFor(type) {
  const compact = ["badge", "icon", "score", "timer", "progress"].includes(type);
  const height = type === "ticker" ? 0.16 : compact ? 0.28 : type === "line" ? 0.08 : 0.64;
  const width = type === "circle" ? 0.32 : compact ? 0.48 : type === "line" ? 0.75 : 0.78;
  return { x: 0.5, y: 0.5, width, height, rotation: 0, anchor: "center", scale: 1, zIndex: 10, safeArea: 0, responsive: { enabled: true } };
}

function rankingEntries() {
  return [
    { position: 1, name: "Rancho El Laurel", total: 318, highlight: true },
    { position: 2, name: "Tres Regalos", total: 311, highlight: false },
    { position: 3, name: "Hacienda de Guadalupe", total: 304, highlight: false },
    { position: 4, name: "Cuenca del Papaloapan", total: 297, highlight: false }
  ];
}

function clone(value) {
  if (value === null || ["string", "number", "boolean"].includes(typeof value)) return value;
  if (Array.isArray(value)) return value.map(clone);
  if (!value || typeof value !== "object") return undefined;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, clone(item)]));
}
