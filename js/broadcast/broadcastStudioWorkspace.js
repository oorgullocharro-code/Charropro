import {
  applyProductionConsoleRealtimeContract,
  autoProductionConsoleOfficialProgram,
  clearProductionConsoleOfficialPreview,
  clearProductionConsoleOfficialProgram,
  configureProductionConsoleOutputRoute,
  connectProductionConsoleRealtime,
  createProductionConsoleModel,
  createProductionConsoleOfficialPreviewEngine,
  createProductionConsoleOfficialProgramEngine,
  createProductionConsoleOutputRoutingEngine,
  createProductionConsoleTemplate,
  createProductionConsoleTemplateRendererIntegration,
  createProductionConsoleThemeTemplateIntegration,
  cutProductionConsoleOfficialProgram,
  disconnectProductionConsoleRealtime,
  disposeProductionConsole,
  prepareProductionConsoleOfficialPreview,
  prepareProductionConsoleOfficialProgram,
  publishProductionConsoleRealtime,
  renderProductionConsoleOfficialPreview,
  resolveProductionConsoleOutputRoute,
  selectProductionConsoleTemplate,
  selectProductionConsoleTemplateFixture,
  takeProductionConsoleOfficialProgram
} from "./productionConsole.js?v=20260716-broadcast-context-resolution-001-real-context-v1";
import {
  applyProgramMainProjection,
  configureProgramMainOutput,
  createProgramMainOutput,
  destroyProgramMainOutput,
  mountProgramMainOutput
} from "./programMainOutput.js?v=20260715-program-main-output-001-official-program-visual-output-v1";
import { destroyTemplateRendererIntegration } from "./templateRendererIntegration.js?v=20260714-template-renderer-integration-001-composed-preview-v1";
import { destroyThemeTemplateIntegration } from "./themeTemplateIntegration.js?v=20260714-theme-template-integration-001-themed-compositions-v1";
import { destroyPreviewEngine } from "./previewEngine.js?v=20260715-preview-engine-001-official-preview-v1";
import { destroyProgramEngine } from "./programEngine.js?v=20260715-program-engine-001-official-program-v1";
import { destroyOutputRoutingEngine } from "./outputRouting.js?v=20260715-browser-output-001-common-web-output-infrastructure-v1";
import { destroyBroadcastRealtimeTransport } from "./broadcastRealtimeTransport.js?v=20260716-broadcast-context-resolution-001-real-context-v1";
import { destroyLiveBindingsEngine } from "./liveBindings.js?v=20260716-broadcast-context-resolution-001-real-context-v1";

export const BROADCAST_STUDIO_WORKSPACE_VERSION = "1.0.0";
export const BROADCAST_STUDIO_APP_VERSION = "20260717-broadcast-studio-workspace-001-operator-workspace-v1";

export const BROADCAST_STUDIO_FILTERS = Object.freeze([
  Object.freeze({ id: "all", label: "Todos" }),
  Object.freeze({ id: "scoreboards", label: "Marcadores" }),
  Object.freeze({ id: "competition", label: "Competencia" }),
  Object.freeze({ id: "results", label: "Resultados" }),
  Object.freeze({ id: "sponsors", label: "Patrocinadores" }),
  Object.freeze({ id: "institutional", label: "Institucional" }),
  Object.freeze({ id: "specials", label: "Especiales" })
]);

export const BROADCAST_STUDIO_GRAPHICS = Object.freeze([
  graphic("main-scoreboard", "Marcador principal", "scoreboards", "Marcador completo de la competencia activa.", ["marcador", "puntos", "equipo"], "scoreboard", "scoreboard"),
  graphic("compact-scoreboard", "Marcador compacto", "scoreboards", "Marcador discreto para continuidad de transmisión.", ["marcador", "compacto", "puntos"], "scoreboard", "compact"),
  graphic("current-team", "Equipo en turno", "competition", "Identificación del equipo o participante activo.", ["turno", "equipo", "participante"], "lower_third", "competition"),
  graphic("next-team", "Siguiente equipo", "competition", "Identificación del siguiente turno programado.", ["siguiente", "orden", "equipo"], "lower_third", "competition"),
  graphic("program", "Programa", "competition", "Resumen operativo de la jornada activa.", ["programa", "jornada", "charreada"], "roster", "competition"),
  graphic("standings", "Clasificación", "results", "Tabla actual de posiciones de la competencia.", ["clasificación", "ranking", "resultados"], "standings", "results"),
  graphic("overall-top", "Top general", "results", "Líderes generales de la competencia activa.", ["top", "general", "líderes"], "ranking", "ranking"),
  graphic("suerte-top", "Top por suerte", "results", "Mejores resultados de la suerte vigente.", ["top", "suerte", "líderes"], "ranking", "ranking"),
  graphic("sponsor", "Patrocinador", "sponsors", "Mención visual del patrocinador autorizado.", ["patrocinador", "marca", "mención"], "sponsor", "sponsor"),
  graphic("lower-third", "Lower third", "specials", "Identificación inferior para participante o invitado.", ["lower third", "nombre", "participante"], "lower_third", "special"),
  graphic("logo", "Logo", "institutional", "Identidad visual autorizada del evento.", ["logo", "marca", "evento"], "bug", "institutional"),
  graphic("welcome", "Bienvenida", "institutional", "Pantalla institucional de apertura.", ["bienvenida", "apertura", "evento"], "full_screen", "institutional"),
  graphic("thanks", "Gracias", "institutional", "Pantalla institucional de cierre.", ["gracias", "cierre", "evento"], "full_screen", "institutional"),
  graphic("interview", "Entrevista", "specials", "Identificación para entrevista en vivo.", ["entrevista", "invitado", "nombre"], "interview", "special"),
  graphic("timer", "Cronómetro", "specials", "Salida reservada para el cronómetro oficial.", ["cronómetro", "tiempo", "reloj"], "timer", "special", true)
]);

const FILTER_IDS = new Set(BROADCAST_STUDIO_FILTERS.map((filter) => filter.id));
const GRAPHICS_BY_ID = new Map(BROADCAST_STUDIO_GRAPHICS.map((entry) => [entry.id, entry]));
const WORKSPACE_INSTANCES = new WeakMap();

export function filterBroadcastStudioGraphics(graphics = BROADCAST_STUDIO_GRAPHICS, query = "", filterId = "all") {
  const normalizedQuery = normalizeSearch(query);
  const normalizedFilter = FILTER_IDS.has(filterId) ? filterId : "all";
  return graphics.filter((entry) => {
    if (normalizedFilter !== "all" && entry.category !== normalizedFilter) return false;
    if (!normalizedQuery) return true;
    const haystack = normalizeSearch([entry.name, entry.categoryLabel, entry.description, ...entry.tags].join(" "));
    return haystack.includes(normalizedQuery);
  });
}

export function createBroadcastStudioController(options = {}) {
  const services = normalizeControllerServices(options.services);
  const subscribers = new Set();
  let state = freezeState({
    workspaceVersion: BROADCAST_STUDIO_WORKSPACE_VERSION,
    selectedGraphicId: null,
    previewGraphicId: null,
    programGraphicId: null,
    query: "",
    filterId: "all",
    busy: false,
    connectionState: options.ready === true ? "ready" : "connecting",
    context: null,
    lastAction: "initialized",
    operationStatus: "Iniciando Workspace",
    error: null
  });

  const publish = (patch) => {
    state = freezeState({ ...state, ...patch });
    subscribers.forEach((subscriber) => subscriber(getState()));
    return getState();
  };
  const getState = () => cloneValue(state);
  const requireGraphic = (graphicId = state.selectedGraphicId) => {
    const entry = GRAPHICS_BY_ID.get(String(graphicId || ""));
    if (!entry) throw workspaceError("broadcast-studio-graphic-not-found");
    if (entry.disabled) throw workspaceError("broadcast-studio-graphic-disabled");
    return entry;
  };
  const run = async (action, status, operation) => {
    if (state.busy) throw workspaceError("broadcast-studio-busy");
    publish({ busy: true, lastAction: action, operationStatus: status, error: null });
    try {
      const result = await operation();
      return { result, state: publish({ busy: false, error: null }) };
    } catch (error) {
      publish({
        busy: false,
        lastAction: `${action}-failed`,
        operationStatus: readableWorkspaceError(error),
        error: error?.code || error?.message || "broadcast-studio-operation-failed"
      });
      throw error;
    }
  };

  return Object.freeze({
    getState,
    subscribe(subscriber) {
      if (typeof subscriber !== "function") return () => {};
      subscribers.add(subscriber);
      subscriber(getState());
      return () => subscribers.delete(subscriber);
    },
    setSearch(query) {
      return publish({ query: String(query ?? ""), lastAction: "search-updated" });
    },
    setFilter(filterId) {
      return publish({ filterId: FILTER_IDS.has(filterId) ? filterId : "all", lastAction: "filter-updated" });
    },
    selectGraphic(graphicId) {
      const entry = requireGraphic(graphicId);
      return publish({
        selectedGraphicId: entry.id,
        lastAction: "graphic-selected",
        operationStatus: `${entry.name} seleccionado`,
        error: null
      });
    },
    previewGraphic(graphicId) {
      const entry = requireGraphic(graphicId);
      services.focusPreview(entry);
      return publish({
        selectedGraphicId: entry.id,
        lastAction: "graphic-preview-selected",
        operationStatus: `${entry.name} listo para preparar`,
        error: null
      });
    },
    async prepare(graphicId = state.selectedGraphicId) {
      const entry = requireGraphic(graphicId);
      if (state.connectionState !== "ready") throw workspaceError("broadcast-studio-context-unavailable");
      const execution = await run("prepare", `Preparando ${entry.name}`, () => services.prepare(entry));
      publish({
        selectedGraphicId: entry.id,
        previewGraphicId: entry.id,
        lastAction: "preview-prepared",
        operationStatus: `${entry.name} en Preview`
      });
      return execution.result;
    },
    async transition(mode = "take") {
      const normalizedMode = ["take", "cut", "auto"].includes(mode) ? mode : "take";
      const entry = requireGraphic(state.previewGraphicId);
      if (state.connectionState !== "ready") throw workspaceError("broadcast-studio-context-unavailable");
      const execution = await run(normalizedMode, `${normalizedMode.toUpperCase()} en proceso`, () => services.transition(normalizedMode, entry));
      publish({
        programGraphicId: entry.id,
        lastAction: `program-${normalizedMode}`,
        operationStatus: `${entry.name} al aire`
      });
      return execution.result;
    },
    async clear() {
      const execution = await run("clear", "Limpiando Preview y Program", () => services.clear());
      publish({
        previewGraphicId: null,
        programGraphicId: null,
        lastAction: "workspace-cleared",
        operationStatus: "Preview y Program limpios"
      });
      return execution.result;
    },
    setRuntimeStatus(runtime = {}) {
      const connectionState = ["connecting", "ready", "error", "offline"].includes(runtime.connectionState)
        ? runtime.connectionState
        : state.connectionState;
      return publish({
        connectionState,
        context: runtime.context === undefined ? state.context : cloneValue(runtime.context),
        operationStatus: runtime.operationStatus || state.operationStatus,
        error: runtime.error === undefined ? state.error : runtime.error
      });
    },
    getFilteredGraphics() {
      return filterBroadcastStudioGraphics(BROADCAST_STUDIO_GRAPHICS, state.query, state.filterId).map(cloneValue);
    },
    getGraphicStatus(graphicId) {
      const entry = GRAPHICS_BY_ID.get(graphicId);
      if (!entry) return "unavailable";
      if (entry.disabled) return "disabled";
      if (state.programGraphicId === graphicId) return "on_air";
      if (state.previewGraphicId === graphicId) return "preview";
      if (state.selectedGraphicId === graphicId) return "prepared";
      return "available";
    }
  });
}

export function createBroadcastStudioEngine(options = {}) {
  const previewHost = options.previewHost;
  const programHost = options.programHost;
  if (!validMountTarget(previewHost) || !validMountTarget(programHost)) throw workspaceError("broadcast-studio-stage-invalid");

  let model = createProductionConsoleModel({ safeMode: false, visibility: "production" });
  let disposed = false;
  let contractQueue = Promise.resolve();
  const templateIds = new Map();
  const listeners = new Set();
  const runtime = {
    templateRendererIntegration: null,
    themeTemplateIntegration: null,
    officialPreviewEngine: null,
    officialPreviewPreparationStore: { preparation: null },
    officialProgramEngine: createProductionConsoleOfficialProgramEngine(model, { engineId: "broadcast_studio_official_program" }),
    outputRoutingEngine: createProductionConsoleOutputRoutingEngine(model, { engineId: "broadcast_studio_output_routing" }),
    realtimeTransport: null,
    realtimeContractUnsubscribe: null,
    realtimePublishQueue: Promise.resolve(),
    realtimeAccess: null,
    firebaseBroadcastApi: null,
    realtimeOfficialContext: null,
    liveBindingsEngine: null
  };
  const programOutput = createProgramMainOutput({
    programMainOutputId: "broadcast-studio-program-main",
    browserOutputId: "broadcast-studio-browser-output",
    name: "Program"
  });
  configureProgramMainOutput(programOutput, {
    displayMode: "responsive",
    visibility: "production",
    resolution: { width: 1920, height: 1080 },
    orientation: "landscape",
    safeArea: { top: 0, right: 0, bottom: 0, left: 0, unit: "percent" },
    transparentBackground: true
  });
  mountProgramMainOutput(programOutput, programHost);

  const emit = (payload = {}) => {
    const event = cloneValue(payload);
    listeners.forEach((listener) => listener(event));
    options.onStatus?.(event);
  };
  const assertReady = () => {
    if (disposed) throw workspaceError("broadcast-studio-destroyed");
    if (model.realtimeSourceReady !== true) throw workspaceError("broadcast-studio-context-unavailable");
  };
  const ensureVisualPipeline = () => {
    if (runtime.templateRendererIntegration) return;
    runtime.templateRendererIntegration = createProductionConsoleTemplateRendererIntegration(model, previewHost, {
      integrationId: "broadcast_studio_template_renderer",
      rendererId: "broadcast_studio_component_renderer"
    });
    runtime.themeTemplateIntegration = createProductionConsoleThemeTemplateIntegration(
      model,
      runtime.templateRendererIntegration,
      { integrationId: "broadcast_studio_theme_template" }
    );
    runtime.officialPreviewEngine = createProductionConsoleOfficialPreviewEngine(
      model,
      runtime.themeTemplateIntegration,
      runtime.officialPreviewPreparationStore,
      { engineId: "broadcast_studio_official_preview" }
    );
  };
  const routeProgram = async (options = {}) => {
    model = configureProductionConsoleOutputRoute(model, runtime.outputRoutingEngine, "route-program-main");
    model = resolveProductionConsoleOutputRoute(model, runtime.outputRoutingEngine, "route-program-main", {
      programEngine: runtime.officialProgramEngine,
      update: true
    });
    const envelope = model.outputRoutingResults?.["route-program-main"];
    if (!envelope) throw workspaceError("broadcast-studio-program-route-unavailable");
    applyProgramMainProjection(programOutput, envelope, { visibility: envelope.visibility || "production" });
    if (model.realtimeSourceReady === true && runtime.realtimeTransport) {
      model = await publishProductionConsoleRealtime(model, runtime, "all", {
        clear: options.clear === true,
        idempotencyKey: `broadcast-studio-${options.action || "program"}-${Date.now()}`
      });
    }
    return envelope;
  };
  const applyContract = (contract) => {
    contractQueue = contractQueue.then(async () => {
      if (disposed) return;
      model = applyProductionConsoleRealtimeContract(model, runtime, contract);
      ensureVisualPipeline();
      try {
        model = await publishProductionConsoleRealtime(model, runtime, "announcer", {
          idempotencyKey: `broadcast-studio-announcer-${Date.now()}`
        });
      } catch (error) {
        emit({ connectionState: "error", context: contextFromModel(model), error: error?.code || error?.message });
        return;
      }
      emit({
        connectionState: "ready",
        context: contextFromModel(model),
        operationStatus: "Sesión oficial conectada",
        error: null
      });
    }).catch((error) => {
      emit({ connectionState: "error", context: null, error: error?.code || error?.message || "broadcast-studio-contract-failed" });
    });
    return contractQueue;
  };

  return Object.freeze({
    getModel: () => cloneValue(model),
    subscribe(listener) {
      if (typeof listener !== "function") return () => {};
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    async connect() {
      if (disposed) throw workspaceError("broadcast-studio-destroyed");
      emit({ connectionState: "connecting", context: null, operationStatus: "Conectando sesión oficial", error: null });
      try {
        model = await connectProductionConsoleRealtime(model, runtime, {
          onContract: applyContract,
          onContractError: (error) => emit({ connectionState: "error", context: null, error: error?.code || error?.message })
        });
        return cloneValue(model.realtimeTransportSnapshot);
      } catch (error) {
        emit({ connectionState: "error", context: null, error: error?.code || error?.message || "broadcast-studio-connect-failed" });
        throw error;
      }
    },
    async prepare(entry) {
      assertReady();
      ensureVisualPipeline();
      model = selectProductionConsoleTemplateFixture(model, entry.templateType);
      const existingTemplateId = templateIds.get(entry.id);
      if (existingTemplateId) model = selectProductionConsoleTemplate(model, existingTemplateId);
      else {
        model = createProductionConsoleTemplate(model);
        templateIds.set(entry.id, model.selectedTemplateId);
      }
      model = prepareProductionConsoleOfficialPreview(
        model,
        runtime.officialPreviewEngine,
        runtime.officialPreviewPreparationStore,
        runtime.themeTemplateIntegration
      );
      model = renderProductionConsoleOfficialPreview(model, runtime.officialPreviewEngine);
      emit({ connectionState: "ready", context: contextFromModel(model), operationStatus: `${entry.name} en Preview`, error: null });
      return cloneValue(model.officialPreviewSnapshot);
    },
    async transition(mode, entry) {
      assertReady();
      ensureVisualPipeline();
      model = prepareProductionConsoleOfficialProgram(model, runtime.officialProgramEngine, runtime.officialPreviewEngine);
      if (mode === "cut") model = cutProductionConsoleOfficialProgram(model, runtime.officialProgramEngine);
      else if (mode === "auto") model = autoProductionConsoleOfficialProgram(model, runtime.officialProgramEngine);
      else model = takeProductionConsoleOfficialProgram(model, runtime.officialProgramEngine);
      const envelope = await routeProgram({ action: mode });
      emit({ connectionState: "ready", context: contextFromModel(model), operationStatus: `${entry.name} al aire`, error: null });
      return cloneValue(envelope);
    },
    async clear() {
      assertReady();
      ensureVisualPipeline();
      model = clearProductionConsoleOfficialPreview(model, runtime.officialPreviewEngine, runtime.officialPreviewPreparationStore);
      model = clearProductionConsoleOfficialProgram(model, runtime.officialProgramEngine);
      const envelope = await routeProgram({ action: "clear", clear: true });
      emit({ connectionState: "ready", context: contextFromModel(model), operationStatus: "Preview y Program limpios", error: null });
      return cloneValue(envelope);
    },
    async dispose() {
      if (disposed) return;
      disposed = true;
      listeners.clear();
      try {
        model = disconnectProductionConsoleRealtime(model, runtime);
      } catch {
        // Local disposal must continue even if the transport already stopped.
      }
      runtime.realtimeContractUnsubscribe?.();
      if (runtime.realtimeTransport && runtime.realtimeTransport.status !== "destroyed") destroyBroadcastRealtimeTransport(runtime.realtimeTransport);
      if (runtime.liveBindingsEngine && runtime.liveBindingsEngine.status !== "destroyed") destroyLiveBindingsEngine(runtime.liveBindingsEngine);
      if (runtime.officialPreviewEngine) destroyPreviewEngine(runtime.officialPreviewEngine);
      if (runtime.officialProgramEngine) destroyProgramEngine(runtime.officialProgramEngine);
      if (runtime.themeTemplateIntegration) destroyThemeTemplateIntegration(runtime.themeTemplateIntegration);
      if (runtime.templateRendererIntegration) destroyTemplateRendererIntegration(runtime.templateRendererIntegration);
      if (runtime.outputRoutingEngine) destroyOutputRoutingEngine(runtime.outputRoutingEngine);
      destroyProgramMainOutput(programOutput);
      disposeProductionConsole(model);
    }
  });
}

export function initializeBroadcastStudioWorkspace(documentRef = globalThis.document, options = {}) {
  const root = documentRef?.querySelector?.("#broadcast-studio-workspace");
  if (!root) return null;
  const existing = WORKSPACE_INSTANCES.get(documentRef);
  if (existing) return existing;
  const refs = collectWorkspaceRefs(documentRef, root);
  const controller = createBroadcastStudioController({ services: options.services, ready: options.ready });
  const engine = options.engine || createBroadcastStudioEngine({
    previewHost: refs.previewCanvas,
    programHost: refs.programCanvas,
    onStatus: (status) => controller.setRuntimeStatus(status)
  });
  const services = options.services ? null : {
    prepare: (entry) => engine.prepare(entry),
    transition: (mode, entry) => engine.transition(mode, entry),
    clear: () => engine.clear(),
    focusPreview: () => refs.previewPanel?.scrollIntoView?.({ behavior: "smooth", block: "center" })
  };
  const operationalController = services ? createBroadcastStudioController({ services }) : controller;
  if (services) engine.subscribe?.((status) => operationalController.setRuntimeStatus(status));
  const activeController = operationalController;
  const abortController = new AbortController();

  renderFilters(refs.filters, activeController);
  const unsubscribe = activeController.subscribe((state) => renderWorkspace(refs, activeController, state));
  bindWorkspaceEvents(refs, activeController, abortController.signal);
  root.dataset.workspaceState = "ready";
  if (options.autoConnect !== false && typeof engine.connect === "function") {
    engine.connect().catch(() => {});
  }

  const api = Object.freeze({
    getState: activeController.getState,
    controller: activeController,
    engine,
    dispose() {
      abortController.abort();
      unsubscribe();
      engine.dispose?.();
      WORKSPACE_INSTANCES.delete(documentRef);
    }
  });
  WORKSPACE_INSTANCES.set(documentRef, api);
  console.info("[broadcast-studio] workspace initialized", {
    version: BROADCAST_STUDIO_WORKSPACE_VERSION,
    catalogSize: BROADCAST_STUDIO_GRAPHICS.length
  });
  return api;
}

function graphic(id, name, category, description, tags, templateType, thumbnail, disabled = false) {
  const categoryLabel = BROADCAST_STUDIO_FILTERS.find((entry) => entry.id === category)?.label || category;
  return Object.freeze({ id, name, category, categoryLabel, description, tags: Object.freeze([...tags]), templateType, thumbnail, disabled });
}

function normalizeControllerServices(services = {}) {
  return {
    prepare: typeof services.prepare === "function" ? services.prepare : async () => null,
    transition: typeof services.transition === "function" ? services.transition : async () => null,
    clear: typeof services.clear === "function" ? services.clear : async () => null,
    focusPreview: typeof services.focusPreview === "function" ? services.focusPreview : () => {}
  };
}

function collectWorkspaceRefs(documentRef, root) {
  const id = (value) => documentRef.getElementById(value);
  return {
    root,
    search: id("broadcast-graphic-search"),
    filters: id("broadcast-category-filters"),
    catalog: id("broadcast-graphic-catalog"),
    catalogCount: id("broadcast-catalog-count"),
    catalogEmpty: id("broadcast-catalog-empty"),
    contextTitle: id("broadcast-context-title"),
    contextDetail: id("broadcast-context-detail"),
    liveStatus: id("broadcast-live-status"),
    liveLabel: id("broadcast-live-label"),
    previewPanel: documentRef.querySelector(".broadcast-preview-panel"),
    previewCanvas: id("broadcast-preview-canvas"),
    previewFrame: documentRef.querySelector(".broadcast-preview-panel .broadcast-stage-frame"),
    previewState: id("broadcast-preview-state"),
    previewName: id("broadcast-preview-name"),
    previewDetail: id("broadcast-preview-detail"),
    programCanvas: id("broadcast-program-canvas"),
    programFrame: documentRef.querySelector(".broadcast-program-panel .broadcast-stage-frame"),
    programState: id("broadcast-program-state"),
    programName: id("broadcast-program-name"),
    programDetail: id("broadcast-program-detail"),
    operationStatus: id("broadcast-operation-status"),
    actionButtons: [...root.querySelectorAll("[data-workspace-action]")]
  };
}

function renderFilters(container, controller) {
  if (!container) return;
  container.replaceChildren(...BROADCAST_STUDIO_FILTERS.map((filter) => {
    const button = container.ownerDocument.createElement("button");
    button.type = "button";
    button.className = "broadcast-filter-button";
    button.textContent = filter.label;
    button.dataset.filterId = filter.id;
    button.setAttribute("aria-pressed", filter.id === controller.getState().filterId ? "true" : "false");
    return button;
  }));
}

function renderWorkspace(refs, controller, state) {
  renderRuntimeStatus(refs, state);
  renderCatalog(refs, controller, state);
  const selected = GRAPHICS_BY_ID.get(state.selectedGraphicId);
  const preview = GRAPHICS_BY_ID.get(state.previewGraphicId);
  const program = GRAPHICS_BY_ID.get(state.programGraphicId);
  refs.previewFrame?.classList.toggle("has-content", Boolean(preview));
  refs.programFrame?.classList.toggle("has-content", Boolean(program));
  setText(refs.previewState, preview ? "PREVIEW" : "VACÍO");
  refs.previewState?.classList.toggle("is-ready", Boolean(preview));
  setText(refs.previewName, preview?.name || selected?.name || "Sin gráfico");
  setText(refs.previewDetail, preview ? "Preparado para salida" : selected ? "Listo para preparar" : "Program permanece intacto");
  setText(refs.programState, program ? "AL AIRE" : "FUERA DEL AIRE");
  refs.programState?.classList.toggle("is-ready", Boolean(program));
  setText(refs.programName, program?.name || "Sin gráfico");
  setText(refs.programDetail, program ? "Gráfico al aire" : "Salida oficial protegida");
  setText(refs.operationStatus, state.operationStatus);
  refs.actionButtons.forEach((button) => {
    const action = button.dataset.workspaceAction;
    const requiresSelection = action === "prepare";
    const requiresPreview = ["take", "cut", "auto"].includes(action);
    const requiresContent = action === "clear";
    button.disabled = state.busy
      || state.connectionState !== "ready"
      || (requiresSelection && !state.selectedGraphicId)
      || (requiresPreview && !state.previewGraphicId)
      || (requiresContent && !state.previewGraphicId && !state.programGraphicId);
  });
}

function renderRuntimeStatus(refs, state) {
  const context = state.context || {};
  setText(refs.contextTitle, context.tournamentName || (state.connectionState === "ready" ? "Torneo conectado" : "Preparando sesión"));
  setText(refs.contextDetail, [context.competitionName, context.charreadaName].filter(Boolean).join(" · ") || "Esperando torneo activo");
  refs.liveStatus.className = `broadcast-live-status is-${state.connectionState === "ready" ? "live" : state.connectionState}`;
  setText(refs.liveLabel, ({ ready: "EN VIVO", connecting: "CONECTANDO", offline: "SIN CONEXIÓN", error: "NO DISPONIBLE" })[state.connectionState] || "NO DISPONIBLE");
}

function renderCatalog(refs, controller, state) {
  const visible = controller.getFilteredGraphics();
  setText(refs.catalogCount, String(visible.length));
  refs.catalogEmpty.hidden = visible.length > 0;
  refs.filters.querySelectorAll("[data-filter-id]").forEach((button) => {
    button.setAttribute("aria-pressed", button.dataset.filterId === state.filterId ? "true" : "false");
  });
  refs.catalog.replaceChildren(...visible.map((entry) => graphicCard(refs.catalog.ownerDocument, controller, entry)));
}

function graphicCard(documentRef, controller, entry) {
  const status = controller.getGraphicStatus(entry.id);
  const card = documentRef.createElement("article");
  card.className = [
    "broadcast-graphic-card",
    status === "prepared" || status === "preview" ? "is-selected" : "",
    status === "on_air" ? "is-on-air" : "",
    status === "disabled" ? "is-disabled" : ""
  ].filter(Boolean).join(" ");
  card.dataset.graphicId = entry.id;

  const thumbnail = documentRef.createElement("div");
  thumbnail.className = "broadcast-graphic-thumbnail";
  thumbnail.dataset.thumbnail = entry.thumbnail;
  thumbnail.setAttribute("aria-hidden", "true");
  const thumbnailLabel = documentRef.createElement("span");
  thumbnailLabel.textContent = entry.name;
  thumbnail.append(thumbnailLabel);

  const body = documentRef.createElement("div");
  body.className = "broadcast-graphic-card-body";
  const category = documentRef.createElement("p");
  category.className = "broadcast-graphic-category";
  category.textContent = entry.categoryLabel;
  const title = documentRef.createElement("h3");
  title.textContent = entry.name;
  const description = documentRef.createElement("p");
  description.className = "broadcast-graphic-description";
  description.textContent = entry.description;
  const footer = documentRef.createElement("div");
  footer.className = "broadcast-graphic-card-footer";
  const stateLabel = documentRef.createElement("span");
  stateLabel.className = `broadcast-graphic-status is-${status.replace("_", "-")}`;
  stateLabel.textContent = statusLabel(status);
  const actions = documentRef.createElement("div");
  actions.className = "broadcast-graphic-actions";
  actions.append(
    cardButton(documentRef, "Vista previa", "preview", entry.id, entry.disabled),
    cardButton(documentRef, "Preparar", "prepare", entry.id, entry.disabled, true)
  );
  footer.append(stateLabel, actions);
  body.append(category, title, description, footer);
  card.append(thumbnail, body);
  return card;
}

function cardButton(documentRef, label, action, graphicId, disabled, primary = false) {
  const button = documentRef.createElement("button");
  button.type = "button";
  button.className = `broadcast-card-button${primary ? " is-primary" : ""}`;
  button.textContent = label;
  button.dataset.cardAction = action;
  button.dataset.graphicId = graphicId;
  button.disabled = disabled;
  return button;
}

function bindWorkspaceEvents(refs, controller, signal) {
  refs.search.addEventListener("input", (event) => controller.setSearch(event.target.value), { signal });
  refs.filters.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-filter-id]");
    if (button) controller.setFilter(button.dataset.filterId);
  }, { signal });
  refs.catalog.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-card-action]");
    if (!button) return;
    const graphicId = button.dataset.graphicId;
    if (button.dataset.cardAction === "preview") controller.previewGraphic(graphicId);
    else runControllerAction(() => controller.prepare(graphicId));
  }, { signal });
  refs.root.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-workspace-action]");
    if (!button) return;
    const action = button.dataset.workspaceAction;
    if (action === "prepare") runControllerAction(() => controller.prepare());
    else if (["take", "cut", "auto"].includes(action)) runControllerAction(() => controller.transition(action));
    else if (action === "clear") runControllerAction(() => controller.clear());
  }, { signal });
}

function runControllerAction(action) {
  Promise.resolve().then(action).catch(() => {});
}

function contextFromModel(model) {
  return {
    tournamentName: model.contract?.tournament?.name || "Torneo conectado",
    competitionName: model.contract?.competition?.name || "Competencia activa",
    charreadaName: model.contract?.charreada?.name || "Jornada activa"
  };
}

function statusLabel(status) {
  return ({ available: "Disponible", prepared: "Preparado", preview: "Preview", on_air: "Al aire", disabled: "Deshabilitado", unavailable: "No disponible" })[status] || status;
}

function readableWorkspaceError(error) {
  const code = error?.code || error?.message || "";
  if (code.includes("context-unavailable")) return "No hay torneo activo disponible";
  if (code.includes("disabled")) return "Gráfico deshabilitado";
  if (code.includes("busy")) return "Operación en curso";
  return "No fue posible completar la operación";
}

function normalizeSearch(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function freezeState(value) {
  return Object.freeze(cloneValue(value));
}

function cloneValue(value) {
  if (value === null || ["string", "number", "boolean"].includes(typeof value)) return value;
  if (Array.isArray(value)) return value.map(cloneValue);
  if (!value || typeof value !== "object") return undefined;
  const result = {};
  Object.entries(value).forEach(([key, entry]) => {
    if (["__proto__", "constructor", "prototype"].includes(key)) return;
    const cloned = cloneValue(entry);
    if (cloned !== undefined) result[key] = cloned;
  });
  return result;
}

function validMountTarget(target) {
  return Boolean(target?.ownerDocument && typeof target.appendChild === "function");
}

function setText(element, value) {
  if (element) element.textContent = String(value ?? "");
}

function workspaceError(code) {
  const error = new Error(code);
  error.name = "BroadcastStudioWorkspaceError";
  error.code = code;
  return error;
}

if (typeof document !== "undefined") initializeBroadcastStudioWorkspace(document);
