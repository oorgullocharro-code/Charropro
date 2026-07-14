import {
  buildComponentInstance,
  createBroadcastComponent
} from "../js/broadcast/componentLibrary.js?v=20260713-component-library-001-components-v1";
import { createBroadcastTemplate } from "../js/broadcast/templateEngine.js?v=20260714-template-engine-001-template-v1";

export const TEMPLATE_ENGINE_FIXTURE_TYPES = Object.freeze([
  "lower_third", "scoreboard", "ranking", "timer", "sponsor", "qr", "roster",
  "full_screen", "interview", "ticker", "standings", "bug"
]);

export const TEMPLATE_ENGINE_FIXTURES = Object.freeze([
  Object.freeze({ type: "lower_third", label: "Lower Third" }),
  Object.freeze({ type: "scoreboard", label: "Marcador" }),
  Object.freeze({ type: "ranking", label: "Ranking" }),
  Object.freeze({ type: "timer", label: "Cronómetro" }),
  Object.freeze({ type: "sponsor", label: "Sponsor" }),
  Object.freeze({ type: "qr", label: "QR" }),
  Object.freeze({ type: "roster", label: "Roster" }),
  Object.freeze({ type: "full_screen", label: "Full Screen" }),
  Object.freeze({ type: "interview", label: "Interview" }),
  Object.freeze({ type: "ticker", label: "Ticker" }),
  Object.freeze({ type: "standings", label: "Standings" }),
  Object.freeze({ type: "bug", label: "Bug" })
]);

const FIXTURE_LABELS = Object.freeze(Object.fromEntries(TEMPLATE_ENGINE_FIXTURES.map((fixture) => [fixture.type, fixture.label])));
const T0 = "2026-07-14T12:00:00.000Z";
const FIXTURE_ACTOR = Object.freeze({ id: "template_fixture", name: "Template fixture", role: "production" });

export function buildTemplateEngineFixture(type = TEMPLATE_ENGINE_FIXTURE_TYPES[0], options = {}) {
  const selected = TEMPLATE_ENGINE_FIXTURE_TYPES.includes(type) ? type : TEMPLATE_ENGINE_FIXTURE_TYPES[0];
  const now = options.now || T0;
  const variant = Number.isInteger(options.variant) ? options.variant : 1;
  const components = componentSpecs(selected).map((spec, index) => buildFixtureInstance(selected, spec, index, now, variant));
  const template = createBroadcastTemplate({
    templateId: options.templateId || `template_fixture_${selected}_${variant}`,
    templateVersion: "1.0.0",
    templateType: selected,
    name: `${FIXTURE_LABELS[selected]} ${variant}`,
    description: `Fixture declarativo de ${FIXTURE_LABELS[selected]}`,
    visibility: "production",
    state: options.state || "active",
    revision: 0,
    components,
    layout: layoutForType(selected),
    bindings: [{
      bindingId: `template_binding_${selected}`,
      target: "defaults.title",
      source: "production_variables",
      key: "production.blockTitle",
      fallback: FIXTURE_LABELS[selected],
      required: false,
      visibility: "production"
    }],
    defaults: {
      title: FIXTURE_LABELS[selected],
      enabled: true,
      count: 0,
      subtitle: ""
    },
    outputs: ["preview", "program"],
    metadata: { fixture: true, source: "template-engine-fixtures", variant },
    createdAt: now,
    updatedAt: now
  }, { now, actor: FIXTURE_ACTOR, random: () => 0.1 + (variant / 1000) });
  return {
    type: selected,
    label: FIXTURE_LABELS[selected],
    template,
    sources: buildFixtureSources(selected)
  };
}

export function getTemplateEngineFixture(type) {
  return buildTemplateEngineFixture(type);
}

function buildFixtureInstance(templateType, spec, index, now, variant) {
  const componentId = `template_component_${templateType}_${index + 1}`;
  const definition = createBroadcastComponent({
    componentId,
    name: spec.name,
    componentType: spec.type,
    componentVersion: "1.0.0",
    componentRevision: 0,
    visibility: "production",
    status: "active",
    bindings: spec.bindings || [],
    style: styleForType(spec.type),
    layout: spec.layout || { x: 0.5, y: 0.5, width: 0.8, height: 0.2, anchor: "center", scale: 1, zIndex: index + 1 },
    animation: { type: "none", duration: 0, delay: 0, easing: "linear", repeat: 0, direction: "normal", trigger: "manual" },
    properties: spec.properties || {},
    metadata: { fixture: true, templateType }
  }, { now, actor: FIXTURE_ACTOR, random: () => 0.2 + (index / 100) });
  return buildComponentInstance(definition, {
    instanceId: `template_instance_${templateType}_${variant}_${index + 1}`
  }, { now, actor: FIXTURE_ACTOR, random: () => 0.3 + (index / 100) });
}

function componentSpecs(type) {
  const contractBinding = (id, target, path, fallback) => ({
    bindingId: id, target, source: "broadcast_contract", path, fallback, required: false, visibility: "production"
  });
  const assetBinding = (id, target, assetId) => ({
    bindingId: id,
    target,
    source: "asset_manager",
    assetRef: { assetId, version: "1.0.0", variantId: null },
    fallback: null,
    required: false,
    visibility: "production"
  });
  const text = (name, path, fallback, layout) => ({
    name, type: "text", properties: { text: fallback, multiline: false, ellipsis: true, maxLines: 1, textTransform: "none" },
    bindings: [contractBinding(`binding_${type}_${path.replaceAll(".", "_")}`, "properties.text", path, fallback)], layout
  });
  if (type === "lower_third") return [
    text("Nombre", "participant.name", "Participante", { x: 0.08, y: 0.76, width: 0.6, height: 0.1, anchor: "top-left", scale: 1, zIndex: 2 }),
    text("Asociación", "participant.association", "Asociación", { x: 0.08, y: 0.86, width: 0.5, height: 0.07, anchor: "top-left", scale: 1, zIndex: 2 })
  ];
  if (type === "scoreboard") return [
    text("Equipo", "team.name", "Equipo", { x: 0.04, y: 0.04, width: 0.35, height: 0.09, anchor: "top-left", scale: 1, zIndex: 2 }),
    { name: "Total", type: "score", properties: { label: "Total", value: 0 }, bindings: [contractBinding("binding_score_total", "properties.value", "score.total", 0)], layout: { x: 0.96, y: 0.04, width: 0.18, height: 0.09, anchor: "top-right", scale: 1, zIndex: 2 } }
  ];
  if (type === "ranking") return [{ name: "Ranking", type: "ranking", properties: { entries: [] }, bindings: [contractBinding("binding_ranking_entries", "properties.entries", "ranking.entries", [])] }];
  if (type === "timer") return [{ name: "Cronómetro", type: "timer", properties: { value: 0, display: "00:00.0", format: "mm:ss.S" }, bindings: [contractBinding("binding_timer_display", "properties.display", "timer.display", "00:00.0")] }];
  if (type === "sponsor") return [{ name: "Patrocinador", type: "sponsor", properties: { assetRef: { assetId: "asset-sponsor", version: "1.0.0", variantId: null } }, bindings: [assetBinding("binding_sponsor_asset", "properties.assetRef", "asset-sponsor")] }];
  if (type === "qr") return [{ name: "QR", type: "qr", properties: { assetRef: { assetId: "asset-qr", version: "1.0.0", variantId: null } }, bindings: [assetBinding("binding_qr_asset", "properties.assetRef", "asset-qr")] }];
  if (type === "roster") return [{ name: "Roster", type: "list", properties: { items: [], spacing: 8, bullet: false }, bindings: [contractBinding("binding_roster", "properties.items", "team.members", [])] }];
  if (type === "full_screen") return [text("Mensaje", "tournament.name", "CharroPro", { x: 0.5, y: 0.5, width: 0.8, height: 0.25, anchor: "center", scale: 1, zIndex: 3 })];
  if (type === "interview") return [
    text("Entrevistado", "participant.name", "Invitado", { x: 0.08, y: 0.76, width: 0.55, height: 0.1, anchor: "top-left", scale: 1, zIndex: 2 }),
    text("Cargo", "participant.category", "Invitado", { x: 0.08, y: 0.86, width: 0.45, height: 0.07, anchor: "top-left", scale: 1, zIndex: 2 })
  ];
  if (type === "ticker") return [{ name: "Ticker", type: "ticker", properties: { items: ["CharroPro"], separator: " · " }, bindings: [contractBinding("binding_ticker", "properties.items", "ranking.entries", [])] }];
  if (type === "standings") return [{ name: "Posiciones", type: "table", properties: { columns: ["Posición", "Nombre", "Total"], rows: [], alignments: ["center", "left", "right"] }, bindings: [contractBinding("binding_standings", "properties.rows", "ranking.entries", [])] }];
  return [{ name: "Bug", type: "logo", properties: { assetRef: { assetId: "asset-tournament-logo", version: "1.0.0", variantId: null } }, bindings: [assetBinding("binding_bug_asset", "properties.assetRef", "asset-tournament-logo")], layout: { x: 0.96, y: 0.04, width: 0.12, height: 0.12, anchor: "top-right", scale: 1, zIndex: 10 } }];
}

function styleForType(type) {
  return {
    fontFamily: "Inter",
    fontSize: ["text", "timer", "score"].includes(type) ? 40 : 26,
    fontWeight: 700,
    italic: false,
    underline: false,
    letterSpacing: 0,
    lineHeight: 1.2,
    color: "#ffffff",
    backgroundColor: "#101216",
    borderColor: "#d6ad43",
    borderWidth: 1,
    borderRadius: 4,
    opacity: 1,
    shadow: null,
    textAlign: "left",
    verticalAlign: "middle",
    padding: 10,
    margin: 0
  };
}

function layoutForType(type) {
  if (["ranking", "standings", "roster"].includes(type)) return { mode: "grid", columns: 1, rows: 1, gap: 16, padding: 24, margin: 0, align: "stretch", justify: "start", anchor: "center", zIndex: 0, clip: true, safeArea: 24 };
  if (["lower_third", "interview", "scoreboard"].includes(type)) return { mode: "overlay", gap: 8, padding: 16, margin: 0, align: "stretch", justify: "start", anchor: "bottom-left", zIndex: 10, clip: true, safeArea: 32 };
  return { mode: "absolute", gap: 0, padding: 0, margin: 0, align: "stretch", justify: "start", anchor: "center", zIndex: 0, clip: true, safeArea: 24 };
}

function buildFixtureSources(type) {
  return {
    productionVariables: { values: { "production.blockTitle": FIXTURE_LABELS[type] } },
    broadcastContract: {
      tournament: { name: "Campeonato CharroPro" },
      participant: { name: "Juan Pérez", association: "Jalisco", category: "AAA" },
      team: { name: "Rancho El Laurel", members: ["Juan Pérez", "Pedro López", "Luis García"] },
      score: { total: 42 },
      timer: { display: "00:34.2" },
      ranking: { entries: [{ position: 1, name: "Rancho El Laurel", total: 318 }] }
    },
    assetManager: {
      assets: {
        "asset-sponsor": { assetId: "asset-sponsor", version: "1.0.0" },
        "asset-qr": { assetId: "asset-qr", version: "1.0.0" },
        "asset-tournament-logo": { assetId: "asset-tournament-logo", version: "1.0.0" }
      }
    }
  };
}
