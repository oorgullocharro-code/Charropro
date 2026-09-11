import {
  applyPublicPortalConnection,
  createPublicPortalClientState,
  evaluatePublicPortalStale
} from "../public/publicPortalClient.js?v=20260911-coleadero-graphics-access-separation-and-width-fix-001-v1";
import { subscribePublicTournamentSnapshot } from "../core/firebaseSync.js?v=20260911-coleadero-graphics-access-separation-and-width-fix-001-v1";
import { createPortalV2Model } from "./portalV2Model.js?v=20260911-coleadero-graphics-access-separation-and-width-fix-001-v1";
import { applyPortalV2Snapshot } from "./portalV2ProjectionState.js?v=20260911-coleadero-graphics-access-separation-and-width-fix-001-v1";
import { buildPortalV2Url, parsePortalV2Route } from "./portalV2Router.js?v=20260911-coleadero-graphics-access-separation-and-width-fix-001-v1";
import { createPortalV2Shell, renderPortalV2 } from "./portalV2Render.js?v=20260911-coleadero-graphics-access-separation-and-width-fix-001-v1";
import { getPortalV2PreviewSnapshot } from "../../fixtures/portalV2PreviewFixtures.js?v=20260911-coleadero-graphics-access-separation-and-width-fix-001-v1";

export const PORTAL_V2_FOUNDATION_VERSION = "1.0.0";

let activePortal = null;

export function bootstrapPortalV2(options = {}) {
  activePortal?.dispose();
  activePortal = createPortalV2App(options);
  activePortal.initialize();
  return activePortal;
}

export function createPortalV2App(options = {}) {
  const environment = options.window || window;
  const documentRef = options.document || document;
  const root = options.root || documentRef.getElementById("portal-v2-root");
  const subscribe = options.subscribe || subscribePublicTournamentSnapshot;
  if (!root) throw new Error("portal-v2-root-required");

  const runtime = {
    disposed: false,
    initialized: false,
    route: parsePortalV2Route(environment.location.href),
    client: createPublicPortalClientState(),
    availability: "loading",
    shell: null,
    unsubscribe: null,
    staleTimer: null,
    listenerCount: 0,
    renderCount: 0
  };

  function initialize() {
    if (runtime.initialized || runtime.disposed) return;
    runtime.initialized = true;
    runtime.shell = createPortalV2Shell(root);
    root.addEventListener("click", handleClick);
    environment.addEventListener("popstate", handlePopState);
    render();
    if (!runtime.route.tournamentId) {
      runtime.availability = "missing-tournament";
      render();
      return;
    }
    const localPreview = resolveLocalPreview(environment.location.href);
    if (localPreview) {
      handleSnapshot(localPreview, { event: "projection", exists: true, localPreview: true });
      return;
    }
    runtime.unsubscribe = subscribe(runtime.route.tournamentId, handleSnapshot);
    runtime.listenerCount = 1;
    runtime.staleTimer = environment.setInterval(checkStale, 15000);
  }

  function handleSnapshot(snapshot, status = {}) {
    if (runtime.disposed) return;
    if (status.event === "connection") {
      runtime.client = applyPublicPortalConnection(runtime.client, status.connected, { error: status.connection === "error" });
      render();
      return;
    }
    const result = applyPortalV2Snapshot(runtime.client, snapshot);
    runtime.client = result.state;
    if (result.accepted) runtime.availability = "ready";
    else if (!runtime.client.snapshot) runtime.availability = status.exists === false ? "not-found" : result.reason === "portal-v2-schema-required" ? "unsupported" : "error";
    render({ changed: result.accepted });
  }

  function handleClick(event) {
    const button = event.target.closest("button[data-portal-v2-view], button[data-portal-v2-competition], button[data-portal-v2-phase]");
    if (!button || !root.contains(button)) return;
    const patch = {};
    if (button.dataset.portalV2View) patch.view = button.dataset.portalV2View;
    if (Object.hasOwn(button.dataset, "portalV2Competition")) patch.competitionId = button.dataset.portalV2Competition;
    if (Object.hasOwn(button.dataset, "portalV2Phase")) patch.phaseId = button.dataset.portalV2Phase;
    const url = buildPortalV2Url(environment.location.href, patch);
    environment.history.pushState({ portalV2: true }, "", url);
    runtime.route = parsePortalV2Route(environment.location.href, { tournamentId: runtime.route.tournamentId });
    render();
  }

  function handlePopState() {
    runtime.route = parsePortalV2Route(environment.location.href, { tournamentId: runtime.route.tournamentId });
    render();
  }

  function checkStale() {
    const next = evaluatePublicPortalStale(runtime.client);
    if (next.connection !== runtime.client.connection) {
      runtime.client = next;
      render();
    }
  }

  function render(options = {}) {
    runtime.renderCount += 1;
    renderPortalV2(runtime.shell, createPortalV2Model(runtime.client.snapshot, {
      availability: runtime.availability,
      connection: runtime.client.connection,
      view: runtime.route.view,
      route: runtime.route
    }), options);
  }

  function dispose() {
    if (runtime.disposed) return;
    runtime.disposed = true;
    runtime.unsubscribe?.();
    if (runtime.staleTimer) environment.clearInterval(runtime.staleTimer);
    root.removeEventListener("click", handleClick);
    environment.removeEventListener("popstate", handlePopState);
  }

  return Object.freeze({
    initialize,
    dispose,
    getState: () => Object.freeze({
      route: { ...runtime.route }, availability: runtime.availability,
      projectionRevision: runtime.client.projectionRevision, listenerCount: runtime.listenerCount,
      renderCount: runtime.renderCount
    })
  });
}

function resolveLocalPreview(href) {
  try {
    const url = new URL(href);
    if (url.searchParams.get("charroproEnv") !== "local") return null;
    return getPortalV2PreviewSnapshot(url.searchParams.get("portalV2Fixture"));
  } catch {
    return null;
  }
}
