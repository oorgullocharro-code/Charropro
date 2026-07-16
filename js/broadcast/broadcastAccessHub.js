export const BROADCAST_ACCESS_HUB_VERSION = "1.0.0";

export const BROADCAST_ACCESS_HUB_SECTIONS = Object.freeze([
  "operation",
  "outputs",
  "status",
  "portals"
]);

export const BROADCAST_ACCESS_HUB_LINKS = Object.freeze([
  Object.freeze({ id: "production-console", section: "operation", label: "Consola de Producción", href: "./production-console.html", description: "Preview, Program, rutas y sincronización local." }),
  Object.freeze({ id: "broadcast-playground", section: "operation", label: "Playground de Broadcast", href: "./broadcast-playground.html", description: "Laboratorio local de componentes y fixtures identificados." }),
  Object.freeze({ id: "program-main", section: "outputs", label: "Program Main Output", href: "./program-main-output.html", description: "Salida visual oficial de Program." }),
  Object.freeze({ id: "announcer-monitor", section: "outputs", label: "Announcer Monitor", href: "./announcer-monitor.html", description: "Monitor operativo de solo lectura para locutores." }),
  Object.freeze({ id: "browser-output", section: "outputs", label: "Browser Output Lab", href: "./browser-output.html?type=generic", description: "Diagnóstico local de la infraestructura de salida web." }),
  Object.freeze({ id: "judges", section: "portals", label: "Portal de Jueces", href: "./jueces.html", description: "Portal operativo independiente de Broadcast Output." }),
  Object.freeze({ id: "supervision", section: "portals", label: "Portal de Supervisión", href: "./supervision.html", description: "Portal operativo independiente de Broadcast Output." })
]);

const HUBS = new WeakMap();
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;
const SECTION_LABELS = Object.freeze({
  operation: "Operación",
  outputs: "Salidas",
  status: "Estado",
  portals: "Portales operativos"
});

export function createBroadcastAccessHub(options = {}) {
  const now = normalizeNow(options.now);
  const accessHubId = normalizeId(options.accessHubId) || "broadcast-access-hub";
  const hub = {
    broadcastAccessHubVersion: BROADCAST_ACCESS_HUB_VERSION,
    accessHubId,
    status: "ready",
    revision: 0,
    createdAt: now,
    updatedAt: now,
    warnings: [],
    errors: []
  };
  HUBS.set(hub, {
    root: null,
    links: BROADCAST_ACCESS_HUB_LINKS.map((link) => ({ ...link })),
    moduleStatus: normalizeModuleStatus(options.moduleStatus),
    destroyed: false
  });
  return hub;
}

export function getBroadcastAccessHub(hub) {
  const runtime = requireHub(hub, { allowDestroyed: true });
  return cloneBroadcastAccessHubResult({
    ...hub,
    links: runtime.links,
    moduleStatus: runtime.moduleStatus,
    mounted: Boolean(runtime.root)
  });
}

export function updateBroadcastAccessHubStatus(hub, patch = {}, options = {}) {
  const runtime = requireHub(hub);
  runtime.moduleStatus = normalizeModuleStatus({ ...runtime.moduleStatus, ...patch });
  hub.revision += 1;
  hub.updatedAt = normalizeNow(options.now);
  if (runtime.root) renderBroadcastAccessHub(hub, runtime.root, options);
  return getBroadcastAccessHub(hub);
}

export function validateBroadcastAccessHub(hub) {
  const errors = [];
  if (!hub || typeof hub !== "object") errors.push("broadcast-access-hub-invalid");
  if (hub?.broadcastAccessHubVersion !== BROADCAST_ACCESS_HUB_VERSION) errors.push("broadcast-access-hub-version-invalid");
  if (!normalizeId(hub?.accessHubId)) errors.push("broadcast-access-hub-id-invalid");
  if (!Number.isInteger(hub?.revision) || hub.revision < 0) errors.push("broadcast-access-hub-revision-invalid");
  if (!isIso(hub?.createdAt) || !isIso(hub?.updatedAt)) errors.push("broadcast-access-hub-timestamp-invalid");
  return { valid: errors.length === 0, errors, warnings: [], broadcastAccessHubVersion: BROADCAST_ACCESS_HUB_VERSION };
}

export function renderBroadcastAccessHub(hub, root, options = {}) {
  const runtime = requireHub(hub);
  if (!root?.ownerDocument || typeof root.replaceChildren !== "function") throw new Error("broadcast-access-hub-target-invalid");
  const documentRef = root.ownerDocument;
  root.replaceChildren();
  root.className = `${String(root.className || "")} broadcast-access-hub`.trim();
  root.setAttribute?.("data-broadcast-access-hub-id", hub.accessHubId);

  const header = element(documentRef, "header", "broadcast-hub-header");
  const heading = element(documentRef, "div", "broadcast-hub-heading");
  heading.append(
    element(documentRef, "p", "broadcast-hub-kicker", "CharroPro"),
    element(documentRef, "h1", "", "Broadcast Studio"),
    element(documentRef, "p", "broadcast-hub-description", "Centro de acceso para operación, salidas y portales independientes.")
  );
  const state = element(documentRef, "div", "broadcast-hub-state");
  state.setAttribute?.("aria-live", "polite");
  state.append(
    statusBadge(documentRef, "Sincronización local", "is-local"),
    element(documentRef, "span", "", "Sin transporte entre equipos")
  );
  header.append(heading, state);
  root.append(header);

  for (const sectionId of ["operation", "outputs"]) {
    const section = sectionShell(documentRef, sectionId, SECTION_LABELS[sectionId]);
    const grid = element(documentRef, "div", "broadcast-hub-link-grid");
    runtime.links.filter((link) => link.section === sectionId).forEach((link) => grid.append(linkCard(documentRef, link, options.baseUrl)));
    section.append(grid);
    root.append(section);
  }

  const statusSection = sectionShell(documentRef, "status", SECTION_LABELS.status);
  const statusGrid = element(documentRef, "div", "broadcast-hub-status-grid");
  Object.entries(runtime.moduleStatus).forEach(([key, value]) => {
    const item = element(documentRef, "article", "broadcast-hub-status-item");
    item.append(
      element(documentRef, "strong", "", statusLabel(key)),
      statusBadge(documentRef, statusText(value), statusClass(value)),
      element(documentRef, "span", "", statusDetail(value))
    );
    statusGrid.append(item);
  });
  statusSection.append(statusGrid);
  root.append(statusSection);

  const portals = sectionShell(documentRef, "portals", SECTION_LABELS.portals);
  portals.append(element(documentRef, "p", "broadcast-hub-section-note", "Estos accesos no son salidas Broadcast y conservan su operación independiente."));
  const portalGrid = element(documentRef, "div", "broadcast-hub-link-grid broadcast-hub-portal-grid");
  runtime.links.filter((link) => link.section === "portals").forEach((link) => portalGrid.append(linkCard(documentRef, link, options.baseUrl)));
  portals.append(portalGrid);
  root.append(portals);

  runtime.root = root;
  hub.status = "mounted";
  hub.updatedAt = normalizeNow(options.now);
  return getBroadcastAccessHub(hub);
}

export function buildBroadcastAccessHubSnapshot(hub, options = {}) {
  const current = getBroadcastAccessHub(hub);
  return cloneBroadcastAccessHubResult({
    snapshotVersion: "1.0.0",
    broadcastAccessHubVersion: BROADCAST_ACCESS_HUB_VERSION,
    accessHubId: current.accessHubId,
    status: current.status,
    revision: current.revision,
    linkIds: current.links.map((link) => link.id),
    sections: [...BROADCAST_ACCESS_HUB_SECTIONS],
    moduleStatus: current.moduleStatus,
    warnings: current.warnings,
    errors: current.errors,
    generatedAt: normalizeNow(options.now)
  });
}

export function destroyBroadcastAccessHub(hub, options = {}) {
  const runtime = requireHub(hub, { allowDestroyed: true });
  if (runtime.destroyed) return hub;
  runtime.root?.replaceChildren?.();
  runtime.root = null;
  runtime.destroyed = true;
  hub.status = "destroyed";
  hub.revision += 1;
  hub.updatedAt = normalizeNow(options.now);
  return hub;
}

export function cloneBroadcastAccessHubResult(value) {
  if (value === null || ["string", "number", "boolean"].includes(typeof value)) return value;
  if (Array.isArray(value)) return value.map(cloneBroadcastAccessHubResult);
  if (!value || typeof value !== "object") return undefined;
  const result = {};
  Object.entries(value).forEach(([key, entry]) => {
    if (["__proto__", "constructor", "prototype"].includes(key)) return;
    const cloned = cloneBroadcastAccessHubResult(entry);
    if (cloned !== undefined) result[key] = cloned;
  });
  return result;
}

export function initializeBroadcastAccessHubPage(documentRef = globalThis.document, options = {}) {
  const root = documentRef?.querySelector?.("#broadcast-access-hub");
  if (!root) return null;
  const hub = createBroadcastAccessHub({
    accessHubId: root.getAttribute?.("data-access-hub-id") || "broadcast-access-hub",
    moduleStatus: options.moduleStatus
  });
  renderBroadcastAccessHub(hub, root, { baseUrl: documentRef.baseURI });
  return hub;
}

function normalizeModuleStatus(value = {}) {
  const defaults = {
    program: { status: "available", detail: "Program Engine disponible en Production Console." },
    program_main: { status: "not-synchronized", detail: "Esperando sincronización explícita en la sesión local." },
    announcer_monitor: { status: "not-synchronized", detail: "Esperando announcer_projection autorizada." },
    local_synchronization: { status: "local", detail: "Solo funciona dentro de la misma página y contexto de ejecución." }
  };
  const result = {};
  Object.entries(defaults).forEach(([key, fallback]) => {
    const candidate = value?.[key];
    result[key] = {
      status: normalizeText(candidate?.status) || fallback.status,
      detail: normalizeText(candidate?.detail) || fallback.detail,
      revision: Number.isInteger(candidate?.revision) && candidate.revision >= 0 ? candidate.revision : null,
      warnings: Array.isArray(candidate?.warnings) ? candidate.warnings.filter((entry) => typeof entry === "string").slice(0, 10) : [],
      errors: Array.isArray(candidate?.errors) ? candidate.errors.filter((entry) => typeof entry === "string").slice(0, 10) : []
    };
  });
  return result;
}

function linkCard(documentRef, link, baseUrl) {
  const card = element(documentRef, "article", "broadcast-hub-link-card");
  card.setAttribute?.("data-broadcast-link", link.id);
  card.append(element(documentRef, "h3", "", link.label), element(documentRef, "p", "", link.description));
  const href = safeInternalHref(link.href, baseUrl || documentRef.baseURI);
  const anchor = element(documentRef, "a", "broadcast-hub-link", "Abrir");
  anchor.setAttribute?.("href", href || "#");
  anchor.setAttribute?.("target", "_blank");
  anchor.setAttribute?.("rel", "noopener noreferrer");
  if (!href) anchor.setAttribute?.("aria-disabled", "true");
  card.append(anchor);
  return card;
}

function sectionShell(documentRef, id, title) {
  const section = element(documentRef, "section", `broadcast-hub-section broadcast-hub-section-${id}`);
  section.setAttribute?.("data-broadcast-section", id);
  section.append(element(documentRef, "h2", "", title));
  return section;
}

function statusBadge(documentRef, label, className) {
  return element(documentRef, "span", `broadcast-hub-badge ${className}`, label);
}

function statusLabel(key) {
  return ({ program: "Program", program_main: "Program Main", announcer_monitor: "Announcer Monitor", local_synchronization: "Sincronización" })[key] || key;
}

function statusText(value) {
  return ({ available: "Disponible", synchronized: "Sincronizado", "not-synchronized": "Sin sincronizar", stale: "Stale", local: "Local", error: "Error" })[value.status] || value.status;
}

function statusDetail(value) {
  if (value.errors?.length) return `${value.detail} ${value.errors.length} error(es).`;
  if (value.warnings?.length) return `${value.detail} ${value.warnings.length} warning(s).`;
  return value.revision === null ? value.detail : `${value.detail} Revisión ${value.revision}.`;
}

function statusClass(value) {
  if (value.errors?.length || value.status === "error") return "is-error";
  if (value.warnings?.length || ["stale", "not-synchronized"].includes(value.status)) return "is-warning";
  return value.status === "synchronized" || value.status === "available" ? "is-ready" : "is-local";
}

function safeInternalHref(href, baseUrl) {
  try {
    const base = new URL(baseUrl || "https://charropro.invalid/");
    if (!["http:", "https:"].includes(base.protocol)) return null;
    const url = new URL(href, base);
    if (url.origin !== base.origin || !/^[a-z0-9-]+\.html$/i.test(url.pathname.split("/").pop() || "")) return null;
    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}

function element(documentRef, tagName, className = "", text = null) {
  const node = documentRef.createElement(tagName);
  if (className) node.className = className;
  if (text !== null) node.textContent = String(text);
  return node;
}

function requireHub(hub, options = {}) {
  const runtime = HUBS.get(hub);
  if (!runtime) throw new Error("broadcast-access-hub-invalid");
  if (runtime.destroyed && !options.allowDestroyed) throw new Error("broadcast-access-hub-destroyed");
  return runtime;
}

function normalizeId(value) {
  const id = typeof value === "string" ? value.trim() : "";
  return SAFE_ID.test(id) ? id : null;
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim().slice(0, 500) : "";
}

function normalizeNow(value) {
  return typeof value === "string" && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : new Date().toISOString();
}

function isIso(value) {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => initializeBroadcastAccessHubPage(document), { once: true });
  else initializeBroadcastAccessHubPage(document);
}
