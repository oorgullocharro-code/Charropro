import {
  createPublicPortalShell,
  renderPublicPortal
} from "../../js/publicPortal/portalRender.js?v=20260727-public-portal-ux-001-live-feed-v1";
import {
  buildPublicPortalModel
} from "../../js/publicPortal/portalSelectors.js?v=20260727-public-portal-ux-001-live-feed-v1";

export const PUBLIC_PORTAL_UX_FIXTURE = Object.freeze({
  schemaVersion: 2,
  projectionRevision: 7,
  generatedAt: "2026-07-27T18:00:00.000Z",
  sourceUpdatedAt: "2026-07-27T17:59:55.000Z",
  status: "live",
  metadata: {
    revision: 1,
    status: "ready",
    tournamentId: "ux-fixture",
    name: "Campeonato Nacional Charro",
    visibility: "public"
  },
  overview: {
    revision: 2,
    status: "live",
    name: "Campeonato Nacional Charro",
    venue: "Lienzo Nacional",
    activeCompetitionId: "equipos",
    activeCharreadaId: "charreada-3",
    activeCompetitionName: "Competencia por equipos",
    activeCharreadaName: "Charreada 3",
    turn: {
      status: "available",
      teamId: "rancho-norte",
      teamName: "Rancho Norte",
      participantId: "charro-uno",
      participantName: "Charro Uno",
      suerteId: "manganas_pie",
      suerteName: "Manganas a pie"
    }
  },
  program: {
    revision: 1,
    status: "ready",
    items: [{
      scheduleId: "charreada-3",
      charreadaId: "charreada-3",
      competitionId: "equipos",
      competitionType: "equipos_completo",
      categoryId: "aaa",
      phaseId: "final",
      phaseName: "Final",
      name: "Charreada 3",
      scheduledDate: "2026-07-27",
      scheduledTime: "17:00",
      order: 1,
      status: "active",
      participants: [{ teamId: "rancho-norte", teamName: "Rancho Norte" }],
      legacy: false
    }]
  },
  live: {
    revision: 3,
    status: "live",
    competitionId: "equipos",
    charreadaId: "charreada-3",
    turn: {
      status: "available",
      team: { id: "rancho-norte", name: "Rancho Norte", association: "Asociacion Centro" },
      participant: { id: "charro-uno", name: "Charro Uno", association: "Asociacion Centro" },
      horse: { id: "caballo-uno", name: "Lucero" },
      suerteId: "manganas_pie",
      suerteName: "Manganas a pie"
    },
    timer: { status: "available", timeMs: 45000, timeText: "0:45", running: true },
    currentResult: {
      resultId: "resultado-1",
      teamId: "rancho-norte",
      teamName: "Rancho Norte",
      participantId: "charro-uno",
      participantName: "Charro Uno",
      suerteId: "manganas_pie",
      score: 26,
      publishedAt: "2026-07-27T17:59:50.000Z"
    },
    standings: [{
      resultId: "resultado-1",
      teamId: "rancho-norte",
      teamName: "Rancho Norte",
      total: 278,
      officialPosition: 1,
      positionStatus: "official",
      active: true
    }],
    updatedAt: "2026-07-27T17:59:55.000Z"
  },
  liveFeed: {
    revision: 4,
    status: "live",
    updatedAt: "2026-07-27T17:59:55.000Z",
    current: {
      competitionId: "equipos",
      charreadaId: "charreada-3",
      teamId: "rancho-norte",
      participantId: "charro-uno",
      suerteId: "manganas_pie",
      attemptNumber: 2,
      phase: "in_progress",
      timerState: "running"
    },
    items: {
      evt4: feedEvent("evt4", 4, "score_published", {
        participantId: "charro-uno",
        suerteId: "manganas_pie",
        attemptNumber: 2,
        score: 26,
        officialTotal: 278,
        officialPosition: 1
      }),
      evt3: feedEvent("evt3", 3, "attempt_started", {
        participantId: "charro-uno",
        suerteId: "manganas_pie",
        attemptNumber: 2,
        status: "in_progress"
      }),
      evt2: feedEvent("evt2", 2, "team_turn_started", { status: "in_progress" }),
      evt1: feedEvent("evt1", 1, "competition_started", { status: "in_progress" })
    }
  },
  competitions: {
    revision: 1,
    status: "ready",
    items: [{
      competitionId: "equipos",
      competitionType: "equipos_completo",
      name: "Competencia por equipos",
      categoryId: "aaa",
      phaseId: "final",
      order: 1,
      status: "live",
      suerteIds: ["cala", "piales", "colas", "toro", "terna", "yegua", "manganas_pie", "manganas_caballo", "paso"],
      charreadaIds: ["charreada-3"],
      competitionScope: "team",
      legacy: false
    }]
  },
  results: {
    revision: 2,
    status: "ready",
    scopes: {},
    items: [{
      resultId: "resultado-1",
      teamId: "rancho-norte",
      teamName: "Rancho Norte",
      association: "Asociacion Centro",
      categoryId: "aaa",
      categoryName: "AAA",
      competitionId: "equipos",
      competitionType: "equipos_completo",
      phaseId: "final",
      phaseName: "Final",
      charreadaId: "charreada-3",
      participantScope: "team",
      scores: { CC: 35, P: 28, C: 75, JT: 18, LC: 25, PR: 20, JY: 19, MP: 26, MC: 22, PM: 10 },
      subtotal: 278,
      teamPenaltyTotal: 0,
      officialTotal: 278,
      officialPosition: 1,
      positionStatus: "official",
      resultStatus: "published",
      publishedAt: "2026-07-27T17:59:50.000Z",
      sourceRevision: 1,
      displayOrder: 1
    }]
  },
  rankings: { revision: 0, status: "unavailable", items: [] },
  statistics: { revision: 0, status: "unavailable", items: [] },
  search: { revision: 0, status: "unavailable", items: [] }
});

export function mountPublicPortalUxFixture(view = "en-vivo", options = {}) {
  const root = document.getElementById("public-portal-root");
  const shell = createPublicPortalShell(root, { logoUrl: "/assets/obs/logo-och-original.png" });
  const model = buildPublicPortalModel(PUBLIC_PORTAL_UX_FIXTURE, {
    competitionId: "equipos",
    feed: options.feed || "all",
    availability: "ready",
    connection: options.connection || "online",
    nowMs: Date.parse("2026-07-27T18:00:00.000Z")
  });
  renderPublicPortal(shell, model, {
    view,
    competitionId: "equipos",
    feed: options.feed || "all",
    connection: options.connection || "online"
  }, { forceView: true });
  globalThis.__publicPortalUxFixture = { shell, model };
  requestAnimationFrame(() => {
    root.dataset.fixtureMetrics = JSON.stringify({
      viewportWidth: document.documentElement.clientWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      rootWidth: root.scrollWidth,
      feedItems: root.querySelectorAll(".public-portal-feed-item").length
    });
  });
  return { shell, model };
}

function feedEvent(eventId, sequence, eventType, overrides = {}) {
  const publishedAt = Date.parse(`2026-07-27T17:5${sequence}:00.000Z`);
  return {
    eventId,
    sequence,
    eventType,
    occurredAt: publishedAt,
    publishedAt,
    competitionId: "equipos",
    charreadaId: "charreada-3",
    teamId: "rancho-norte",
    status: "official",
    revision: 1,
    ...overrides
  };
}

if (typeof document !== "undefined" && document.getElementById("public-portal-root")) {
  const fixtureUrl = new URL(location.href);
  mountPublicPortalUxFixture(fixtureUrl.searchParams.get("fixtureView") || "en-vivo", {
    feed: fixtureUrl.searchParams.get("feed") || "all",
    connection: fixtureUrl.searchParams.get("connection") || "online"
  });
}
