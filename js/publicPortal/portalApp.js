import {
  applyPublicPortalConnection,
  applyPublicPortalSnapshot,
  createPublicPortalClientState,
  evaluatePublicPortalStale
} from "../public/publicPortalClient.js?v=20260727-public-portal-program-ux-001-program-phase-pm-v1";
import { subscribePublicTournamentSnapshot } from "../core/firebaseSync.js?v=20260808-fmch-2026-jineteos-dynamic-001-v1";
import {
  buildPublicPortalUrl,
  parsePublicPortalRoute
} from "./portalRouter.js?v=20260727-public-portal-program-ux-001-program-phase-pm-v1";
import { buildPublicPortalModel } from "./portalSelectors.js?v=20260728-public-live-feed-integration-001-fix-001-v1";
import {
  announcePublicPortalChange,
  createPublicPortalShell,
  renderPublicPortal,
  renderPublicPortalConnection
} from "./portalRender.js?v=20260728-public-portal-design-system-v2-001-sports-ui-v2";

export const PUBLIC_PORTAL_CORE_VERSION = "2.0.0";

let activePortal = null;

export function bootstrapPublicPortal(options = {}) {
  activePortal?.dispose();
  activePortal = createPublicPortalApp(options);
  activePortal.initialize();
  return activePortal;
}

export function createPublicPortalApp(options = {}) {
  const environment = options.window || window;
  const documentRef = options.document || document;
  const root = options.root || documentRef.getElementById("public-portal-root");
  if (!root) throw new Error("public-portal-root-required");

  const runtime = {
    disposed: false,
    initialized: false,
    route: parsePublicPortalRoute(environment.location.href),
    client: createPublicPortalClientState(),
    projection: null,
    model: null,
    shell: null,
    unsubscribe: null,
    staleTimer: null,
    availability: "loading",
    resultSignatures: new Map(),
    startedAt: performanceNow(),
    renderCount: 0,
    projectionListenerCount: 0,
    connectionListenerCount: 0,
    displayedFeedIds: new Set(),
    pendingFeedIds: new Set()
  };

  function initialize() {
    if (runtime.initialized || runtime.disposed) return;
    runtime.initialized = true;
    runtime.shell = createPublicPortalShell(root, {
      logoUrl: "./assets/obs/logo-och-original.png"
    });
    runtime.model = buildModel();
    applyFeedVisibility(runtime.model, false);
    render({ forceView: true });
    root.addEventListener("click", handleClick);
    root.addEventListener("change", handleChange);
    environment.addEventListener("popstate", handlePopState);

    if (!runtime.route.tournamentId) {
      runtime.availability = "missing-tournament";
      runtime.model = buildModel();
      render({ forceView: true });
      return;
    }

    runtime.unsubscribe = subscribePublicTournamentSnapshot(
      runtime.route.tournamentId,
      handlePublicSnapshot
    );
    runtime.projectionListenerCount = 1;
    runtime.connectionListenerCount = 1;
    runtime.staleTimer = environment.setInterval(checkStale, 15000);
    logDevelopment("initialized", {
      tournamentId: runtime.route.tournamentId,
      view: runtime.route.view,
      version: PUBLIC_PORTAL_CORE_VERSION
    });
  }

  function handlePublicSnapshot(snapshot, status = {}) {
    if (runtime.disposed) return;
    if (status.event === "connection") {
      runtime.client = applyPublicPortalConnection(runtime.client, status.connected);
      renderPublicPortalConnection(runtime.shell, runtime.client.connection, runtime.model);
      announcePublicPortalChange(runtime.shell, runtime.model, runtime.client.connection);
      return;
    }

    if (snapshot && hasUnsupportedSchema(snapshot)) {
      runtime.availability = "unsupported";
      runtime.model = buildModel();
      render({ forceView: true });
      return;
    }

    const result = applyPublicPortalSnapshot(runtime.client, snapshot);
    runtime.client = result.state;
    if (!result.accepted) {
      if (!runtime.projection) {
        runtime.availability = status.exists === false ? "not-found" : "error";
        runtime.model = buildModel();
        render({ forceView: true });
      } else {
        renderPublicPortalConnection(runtime.shell, runtime.client.connection, runtime.model);
      }
      return;
    }

    const previousAvailability = runtime.availability;
    runtime.projection = result.legacy ? runtime.client.legacySnapshot : runtime.client.snapshot;
    runtime.availability = "ready";
    const previousSignatures = runtime.resultSignatures;
    runtime.model = buildModel();
    applyFeedVisibility(runtime.model, shouldDeferFeedUpdates());
    reconcileResolvedRoute();
    runtime.resultSignatures = buildResultSignatures(runtime.model.allResults);
    const updatedResultIds = compareResultSignatures(previousSignatures, runtime.resultSignatures);
    render({
      changedSections: result.changedSections,
      updatedResultIds,
      forceView: Boolean(result.legacy || previousAvailability !== "ready")
    });
    announcePublicPortalChange(runtime.shell, runtime.model, runtime.client.connection);
    logDevelopment("projection", {
      schemaVersion: runtime.model.schemaVersion,
      projectionRevision: runtime.model.projectionRevision,
      view: runtime.route.view,
      changedSections: result.changedSections,
      renderMs: elapsed(runtime.startedAt)
    });
  }

  function handleClick(event) {
    const target = event.target.closest("button");
    if (!target || !root.contains(target)) return;
    const view = target.dataset.portalView || target.dataset.portalViewTarget;
    const competitionId = target.dataset.portalCompetitionChoice;
    const feed = target.dataset.portalFeedFilter;
    const hasProgramDay = target.dataset.portalProgramDay !== undefined;
    const hasProgramPhase = target.dataset.portalProgramPhase !== undefined;
    const hasProgramDetail = target.dataset.portalProgramDetail !== undefined;
    const programResults = target.dataset.portalProgramResults;
    const programLive = target.dataset.portalProgramLive;
    if (target.dataset.portalFeedShowNew !== undefined) {
      runtime.pendingFeedIds.clear();
      runtime.model = buildModel();
      applyFeedVisibility(runtime.model, false);
      render({ forceView: true });
      runtime.shell.main.querySelector("[data-portal-feed-list]")?.scrollIntoView({
        behavior: reducedMotion(environment) ? "auto" : "smooth",
        block: "start"
      });
      return;
    }
    if (
      !view &&
      !competitionId &&
      !feed &&
      !hasProgramDay &&
      !hasProgramPhase &&
      !hasProgramDetail &&
      !programResults &&
      !programLive
    ) return;
    const patch = {};
    if (view) patch.view = view;
    if (feed) patch.feed = feed;
    if (hasProgramDay) {
      patch.programDay = target.dataset.portalProgramDay;
      patch.charreadaId = "";
    }
    if (hasProgramPhase) {
      patch.programPhaseId = target.dataset.portalProgramPhase;
      patch.charreadaId = "";
    }
    if (hasProgramDetail) patch.charreadaId = target.dataset.portalProgramDetail;
    if (programResults) {
      patch.view = "resultados";
      patch.charreadaId = programResults;
    }
    if (programLive) patch.view = "en-vivo";
    if (competitionId) {
      patch.competitionId = competitionId;
      patch.categoryId = "";
      patch.phaseId = "";
      if (!hasProgramDetail && !programResults) patch.charreadaId = "";
    }
    updateRoute(patch);
  }

  function handleChange(event) {
    const target = event.target;
    if (!(target instanceof environment.HTMLSelectElement)) return;
    if (target.matches("[data-portal-competition]")) {
      updateRoute({
        competitionId: target.value,
        categoryId: "",
        phaseId: "",
        charreadaId: ""
      });
      return;
    }
    const filter = target.dataset.portalFilter;
    if (filter && ["categoryId", "phaseId", "charreadaId"].includes(filter)) {
      updateRoute({ [filter]: target.value });
    }
  }

  function handlePopState() {
    runtime.route = parsePublicPortalRoute(environment.location.href, {
      tournamentId: runtime.route.tournamentId
    });
    runtime.model = buildModel();
    reconcileResolvedRoute();
    applyFeedVisibility(runtime.model, false);
    render({ forceView: true });
  }

  function updateRoute(patch, options = {}) {
    if (Object.prototype.hasOwnProperty.call(patch, "feed")) runtime.pendingFeedIds.clear();
    const nextUrl = buildPublicPortalUrl(environment.location.href, patch);
    if (options.replace) environment.history.replaceState({ publicPortal: true }, "", nextUrl);
    else environment.history.pushState({ publicPortal: true }, "", nextUrl);
    runtime.route = parsePublicPortalRoute(environment.location.href, {
      tournamentId: runtime.route.tournamentId
    });
    runtime.model = buildModel();
    applyFeedVisibility(runtime.model, false);
    reconcileResolvedRoute({ updateUrl: false });
    render({ forceView: true });
  }

  function reconcileResolvedRoute(options = {}) {
    const currentUrl = new URL(environment.location.href);
    const resolvedCompetitionId = runtime.model?.selectedCompetitionId || "";
    const resolvedProgramDay = runtime.model?.activeProgramFilters?.day || "";
    const resolvedProgramPhaseId = runtime.model?.activeProgramFilters?.phaseId || "";
    const competitionChanged = Boolean(
      resolvedCompetitionId &&
      runtime.route.competitionId !== resolvedCompetitionId
    );
    const programDayChanged = (
      runtime.route.programDay !== resolvedProgramDay ||
      (currentUrl.searchParams.has("day") && !runtime.route.programDay)
    );
    const programPhaseChanged = (
      runtime.route.programPhaseId !== resolvedProgramPhaseId ||
      (currentUrl.searchParams.has("phase") && !runtime.route.programPhaseId)
    );
    const programDetailChanged = Boolean(
      runtime.route.view === "programa" &&
      runtime.route.charreadaId &&
      !runtime.model?.programDetail
    );
    if (!competitionChanged && !programDayChanged && !programPhaseChanged && !programDetailChanged) return;
    runtime.route = {
      ...runtime.route,
      competitionId: competitionChanged ? resolvedCompetitionId : runtime.route.competitionId,
      categoryId: competitionChanged ? "" : runtime.route.categoryId,
      phaseId: competitionChanged ? "" : runtime.route.phaseId,
      charreadaId: competitionChanged || programDetailChanged ? "" : runtime.route.charreadaId,
      programDay: resolvedProgramDay,
      programPhaseId: resolvedProgramPhaseId
    };
    runtime.model = buildModel();
    applyFeedVisibility(runtime.model, false);
    if (options.updateUrl === false) return;
    const nextUrl = buildPublicPortalUrl(environment.location.href, runtime.route);
    environment.history.replaceState({ publicPortal: true }, "", nextUrl);
  }

  function checkStale() {
    if (runtime.disposed) return;
    const previousConnection = runtime.client.connection;
    const previousFreshness = runtime.model?.liveFeed?.freshness;
    const next = evaluatePublicPortalStale(runtime.client);
    runtime.client = next;
    runtime.model = buildModel();
    applyFeedVisibility(runtime.model, true);
    if (
      next.connection !== previousConnection ||
      previousFreshness !== runtime.model?.liveFeed?.freshness
    ) {
      render({ changedSections: ["liveFeed"] });
      announcePublicPortalChange(runtime.shell, runtime.model, runtime.client.connection);
    } else {
      renderPublicPortalConnection(runtime.shell, runtime.client.connection);
    }
  }

  function buildModel() {
    return buildPublicPortalModel(runtime.projection, {
      ...runtime.route,
      availability: runtime.availability,
      connection: runtime.client.connection,
      nowMs: Date.now()
    });
  }

  function applyFeedVisibility(model, deferNewEvents) {
    const allItems = model?.liveFeed?.items || [];
    const allIds = new Set(allItems.map((item) => item.eventId));
    if (!deferNewEvents) runtime.pendingFeedIds.clear();
    if (!runtime.displayedFeedIds.size) {
      runtime.displayedFeedIds = allIds;
    } else {
      for (const eventId of allIds) {
        if (!runtime.displayedFeedIds.has(eventId) && deferNewEvents) runtime.pendingFeedIds.add(eventId);
        else runtime.displayedFeedIds.add(eventId);
      }
    }
    for (const eventId of [...runtime.pendingFeedIds]) {
      if (!allIds.has(eventId)) runtime.pendingFeedIds.delete(eventId);
    }
    model.liveFeed.items = allItems.filter((item) => !runtime.pendingFeedIds.has(item.eventId));
    model.liveFeed.pendingCount = runtime.pendingFeedIds.size;
  }

  function shouldDeferFeedUpdates() {
    if (runtime.route.view !== "en-vivo" || !runtime.displayedFeedIds.size) return false;
    const list = runtime.shell?.main?.querySelector("[data-portal-feed-list]");
    return Boolean(list && list.getBoundingClientRect().top < 80);
  }

  function render(renderOptions = {}) {
    const startedAt = performanceNow();
    const metrics = renderPublicPortal(runtime.shell, runtime.model, {
      ...runtime.route,
      connection: runtime.client.connection
    }, renderOptions);
    runtime.renderCount += 1;
    logDevelopment("render", {
      view: metrics.view,
      availability: runtime.model.availability,
      forceView: Boolean(renderOptions.forceView),
      durationMs: elapsed(startedAt),
      nodes: metrics.nodeCount
    });
  }

  function dispose() {
    if (runtime.disposed) return;
    runtime.disposed = true;
    runtime.unsubscribe?.();
    runtime.unsubscribe = null;
    if (runtime.staleTimer) environment.clearInterval(runtime.staleTimer);
    runtime.staleTimer = null;
    root.removeEventListener("click", handleClick);
    root.removeEventListener("change", handleChange);
    environment.removeEventListener("popstate", handlePopState);
    runtime.projectionListenerCount = 0;
    runtime.connectionListenerCount = 0;
  }

  return {
    initialize,
    dispose,
    getSnapshot() {
      return {
        initialized: runtime.initialized,
        disposed: runtime.disposed,
        route: { ...runtime.route },
        connection: runtime.client.connection,
        projectionRevision: runtime.model?.projectionRevision || 0,
        renderCount: runtime.renderCount,
        projectionListenerCount: runtime.projectionListenerCount,
        connectionListenerCount: runtime.connectionListenerCount
      };
    }
  };
}

function reducedMotion(environment) {
  return Boolean(environment.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
}

function hasUnsupportedSchema(snapshot) {
  if (snapshot.schemaVersion === undefined || snapshot.schemaVersion === null) return false;
  return ![1, 2].includes(Number(snapshot.schemaVersion));
}

function buildResultSignatures(results = []) {
  return new Map(results.map((row) => [
    row.resultId,
    [
      row.sourceRevision,
      row.officialTotal,
      row.officialPosition,
      row.subtotal,
      JSON.stringify(row.scores)
    ].join("|")
  ]));
}

function compareResultSignatures(previous, next) {
  const changed = new Set();
  for (const [resultId, signature] of next) {
    if (previous.has(resultId) && previous.get(resultId) !== signature) changed.add(resultId);
  }
  return changed;
}

function performanceNow() {
  return globalThis.performance?.now?.() || Date.now();
}

function elapsed(startedAt) {
  return Math.round((performanceNow() - startedAt) * 100) / 100;
}

function logDevelopment(event, detail) {
  const hostname = globalThis.location?.hostname || "";
  if (!["localhost", "127.0.0.1"].includes(hostname)) return;
  console.info(`[public-portal-core] ${event}`, JSON.stringify(detail));
}
