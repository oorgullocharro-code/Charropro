import {
  createPublicPortalShell,
  renderPublicPortal
} from "../../js/publicPortal/portalRender.js?v=20260727-public-portal-program-ux-001-program-phase-pm-v1";
import {
  buildPublicPortalModel
} from "../../js/publicPortal/portalSelectors.js?v=20260727-public-portal-program-ux-001-program-phase-pm-v1";

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
    items: [
      programItem({
        charreadaId: "charreada-1",
        name: "Charreada clasificatoria",
        date: "2026-07-27",
        time: "11:00",
        phaseId: "clasificatoria",
        phaseName: "Clasificatoria",
        order: 1,
        status: "completed",
        participants: [
          participant("equipo-centro", "Equipo Centro", 1, "Centro"),
          participant("equipo-bajio", "Equipo Bajío", 2, "Bajío"),
          participant("equipo-sur", "Equipo Sur", 3, "Sur")
        ],
        resultsAvailable: true
      }),
      programItem({
        charreadaId: "charreada-3",
        name: "Semifinal por equipos",
        date: "2026-07-28",
        time: "17:00",
        phaseId: "semifinal",
        phaseName: "Semifinal",
        order: 2,
        status: "live",
        participants: [
          participant("rancho-norte", "Rancho Norte", 1, "Norte"),
          participant("hacienda-real", "Hacienda Real", 2, "Centro"),
          participant("charros-del-sol", "Charros del Sol", 3, "Occidente"),
          participant("rancho-grande", "Rancho Grande", 4, "Bajío")
        ],
        liveAvailable: true,
        resultsAvailable: true
      }),
      programItem({
        charreadaId: "charreada-final",
        name: "Final Charro Completo",
        date: "2026-07-29",
        time: "19:00",
        phaseId: "final",
        phaseName: "Final",
        order: 3,
        status: "scheduled",
        competitionId: "charro-completo",
        competitionType: "charro_completo",
        competitionScope: "individual",
        competitionName: "Charro Completo",
        categoryName: "Libre",
        participants: [
          participant("charro-uno", "Alejandro Pérez", 1, "Jalisco", "individual"),
          participant("charro-dos", "Daniel Robles", 2, "Hidalgo", "individual")
        ]
      })
    ]
  },
  live: {
    revision: 3,
    status: "live",
    competitionId: "equipos",
    charreadaId: "charreada-3",
    turn: {
      status: "available",
      team: { id: "rancho-norte", name: "Rancho Norte" },
      participant: { id: "charro-uno", name: "Charro Uno" },
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
      categoryId: "aaa",
      categoryName: "AAA",
      competitionId: "equipos",
      competitionType: "equipos_completo",
      phaseId: "final",
      phaseName: "Final",
      charreadaId: "charreada-3",
      participantScope: "team",
      scores: { CC: 35, P: 28, C: 75, JT: 18, LC: 25, PR: 20, JY: 19, MP: 26, MC: 22, PM: 24 },
      subtotal: 278,
      teamPenaltyTotal: -4,
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
    programDay: options.programDay || "",
    programPhaseId: options.programPhaseId || "",
    charreadaId: options.charreadaId || "",
    feed: options.feed || "all",
    availability: "ready",
    connection: options.connection || "online",
    nowMs: Date.parse("2026-07-27T18:00:00.000Z")
  });
  renderPublicPortal(shell, model, {
    view,
    competitionId: "equipos",
    programDay: options.programDay || "",
    programPhaseId: options.programPhaseId || "",
    charreadaId: options.charreadaId || "",
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

function programItem(options) {
  return {
    scheduleId: options.charreadaId,
    sequence: options.order,
    charreadaId: options.charreadaId,
    competitionId: options.competitionId || "equipos",
    competitionType: options.competitionType || "equipos_completo",
    competitionScope: options.competitionScope || "team",
    competitionName: options.competitionName || "Competencia por equipos",
    categoryId: "aaa",
    categoryName: options.categoryName || "AAA",
    phaseId: options.phaseId,
    phaseName: options.phaseName,
    name: options.name,
    shortTitle: options.name,
    scheduledDate: options.date,
    scheduledTime: options.time,
    endTime: "",
    order: options.order,
    status: options.status,
    venueName: "Lienzo Nacional",
    participantType: options.competitionScope || "team",
    participants: options.participants || [],
    publicNotes: options.order === 3 ? "Acceso sujeto a disponibilidad." : "",
    liveAvailable: Boolean(options.liveAvailable),
    resultsAvailable: Boolean(options.resultsAvailable),
    revision: 1,
    updatedAt: "2026-07-27T17:59:55.000Z",
    legacy: false
  };
}

function participant(id, name, order, region, type = "team") {
  return { id, type, name, order, region, status: "ready" };
}

if (typeof document !== "undefined" && document.getElementById("public-portal-root")) {
  const fixtureUrl = new URL(location.href);
  mountPublicPortalUxFixture(fixtureUrl.searchParams.get("fixtureView") || "en-vivo", {
    feed: fixtureUrl.searchParams.get("feed") || "all",
    connection: fixtureUrl.searchParams.get("connection") || "online",
    programDay: fixtureUrl.searchParams.get("day") || "",
    programPhaseId: fixtureUrl.searchParams.get("phase") || "",
    charreadaId: fixtureUrl.searchParams.get("charreadaId") || ""
  });
}
