import {
  createPublicPortalShell,
  renderPublicPortal
} from "../../js/publicPortal/portalRender.js?v=20260830-negative-timing-attempt-v2-official-publication-recovery-001-v1";
import {
  buildPublicPortalModel
} from "../../js/publicPortal/portalSelectors.js?v=20260830-negative-timing-attempt-v2-official-publication-recovery-001-v1";

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
    standings: [
      liveStanding("resultado-1", "rancho-norte", "Rancho Norte", 278, 1, true),
      liveStanding("resultado-2", "hacienda-real", "Hacienda Real", 274, 2),
      liveStanding("resultado-3", "charros-del-sol", "Charros del Sol", 269, 3),
      liveStanding("resultado-4", "rancho-grande", "Rancho Grande", 260, 4)
    ],
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
      evt8: feedEvent("evt8", 8, "score_corrected", {
        participantId: "charro-uno",
        suerteId: "manganas_pie",
        attemptNumber: 2,
        previousScore: 24,
        score: 26,
        correctionReason: "Corrección oficial publicada"
      }),
      evt7: feedEvent("evt7", 7, "penalty_published", {
        participantId: "charro-uno",
        suerteId: "manganas_pie",
        penalty: -4,
        officialTotal: 278
      }),
      evt6: feedEvent("evt6", 6, "timer_finished", {
        participantId: "charro-uno",
        suerteId: "manganas_pie",
        timeMs: 45000,
        timeText: "0:45"
      }),
      evt5: feedEvent("evt5", 5, "official_position_changed", {
        participantId: "charro-uno",
        officialPosition: 1
      }),
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
    }, {
      competitionId: "charro-completo",
      competitionType: "charro_completo",
      name: "Charro Completo",
      categoryId: "libre",
      phaseId: "final",
      order: 2,
      status: "scheduled",
      suerteIds: ["cala", "piales", "colas", "toro", "manganas_pie", "manganas_caballo", "paso"],
      charreadaIds: ["charreada-final"],
      competitionScope: "individual",
      legacy: false
    }]
  },
  results: {
    revision: 2,
    status: "ready",
    scopes: {},
    items: [
      fixtureResult("resultado-1", "rancho-norte", "Rancho Norte", 1, 278, {
        scores: { CC: 35, P: 28, C: 75, JT: 18, LC: 25, PR: 20, JY: 19, MP: 26, MC: 22, PM: 24 },
        teamPenaltyTotal: -4
      }),
      fixtureResult("resultado-2", "hacienda-real", "Hacienda Real", 2, 274),
      fixtureResult("resultado-3", "charros-del-sol", "Charros del Sol", 3, 269),
      fixtureResult("resultado-4", "rancho-grande", "Rancho Grande", 4, 260, {
        scores: { CC: 0, P: 27, C: 72, JT: 17, LC: 24, PR: 18, JY: 20, MP: 27, MC: 24, PM: 24 }
      }),
      fixtureResult("resultado-5", "hacienda-larga", "Hacienda de Nuestra Señora del Camino Real de los Altos", 5, 256),
      fixtureResult("resultado-6", "charros-bajio", "Charros Unidos del Bajío", 6, 252),
      fixtureResult("resultado-7", "rancho-estrella", "Rancho La Estrella", 7, 248),
      fixtureResult("resultado-8", "asociados-centro", "Equipo del Centro", 8, 244),
      fixtureResult("resultado-9", "tres-potillos", "Tres Potrillos", 9, 239),
      fixtureResult("resultado-10", "hacienda-sur", "Hacienda del Sur", 10, 235),
      fixtureResult("resultado-11", "charros-valle", "Charros del Valle", 11, 229),
      fixtureResult("resultado-12", "rancho-sierra", "Rancho de la Sierra", 12, null, {
        subtotal: 224,
        accumulatedTotal: 224,
        totalStatus: "partial",
        provisionalPosition: 12,
        positionStatus: "provisional",
        scores: { CC: 31, P: 25, C: 68, JT: 16, LC: 22, PR: 17, JY: 18, MP: 27, MC: 0 }
      })
    ]
  },
  rankings: { revision: 0, status: "unavailable", items: [] },
  statistics: { revision: 0, status: "unavailable", items: [] },
  search: { revision: 0, status: "unavailable", items: [] }
});

export function mountPublicPortalUxFixture(view = "en-vivo", options = {}) {
  const root = document.getElementById("public-portal-root");
  const shell = createPublicPortalShell(root, { logoUrl: "/assets/obs/logo-och-original.png" });
  const snapshot = buildFixtureScenario(options.scenario);
  const model = buildPublicPortalModel(snapshot, {
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

function buildFixtureScenario(scenario = "live") {
  const snapshot = structuredClone(PUBLIC_PORTAL_UX_FIXTURE);
  if (scenario === "scheduled" || scenario === "empty-live") {
    snapshot.status = "ready";
    snapshot.live.status = "scheduled";
    snapshot.live.turn = { status: "unavailable" };
    snapshot.live.currentResult = null;
    snapshot.live.standings = [];
    snapshot.liveFeed.status = "ready";
    snapshot.liveFeed.items = {};
  }
  if (scenario === "finished") {
    snapshot.status = "finished";
    snapshot.overview.status = "finished";
    snapshot.live.status = "finished";
    snapshot.live.turn = { status: "unavailable" };
    snapshot.live.currentResult = null;
    snapshot.live.timer = { status: "unavailable", running: false };
    snapshot.liveFeed.status = "finished";
  }
  if (scenario === "partial") {
    snapshot.results.items = [
      fixtureResult("partial-a", "equipo-a", "Charros Demo del Norte", null, null, {
        scores: { CC: 38 },
        subtotal: 38,
        accumulatedTotal: 38,
        totalStatus: "partial",
        provisionalPosition: 1,
        positionStatus: "provisional",
        displayOrder: 1
      }),
      fixtureResult("partial-b", "equipo-b", "Rancheros de Ensayo", null, null, {
        scores: { CC: 26 },
        subtotal: 26,
        accumulatedTotal: 26,
        totalStatus: "partial",
        provisionalPosition: 2,
        positionStatus: "provisional",
        displayOrder: 2
      })
    ];
    snapshot.live.standings = [
      { resultId: "partial-a", teamId: "equipo-a", teamName: "Charros Demo del Norte", total: 38, provisionalPosition: 1, positionStatus: "provisional" },
      { resultId: "partial-b", teamId: "equipo-b", teamName: "Rancheros de Ensayo", total: 26, provisionalPosition: 2, positionStatus: "provisional" }
    ];
  }
  if (scenario === "long-content") {
    snapshot.metadata.name = "Gran Campeonato Nacional de Charrería y Tradición Deportiva de México";
    snapshot.overview.name = snapshot.metadata.name;
    snapshot.overview.venue = "Lienzo Charro Metropolitano de la Región de los Altos de Jalisco";
  }
  return snapshot;
}

function feedEvent(eventId, sequence, eventType, overrides = {}) {
  const minute = String(Math.min(59, 49 + sequence)).padStart(2, "0");
  const publishedAt = Date.parse(`2026-07-27T17:${minute}:00.000Z`);
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

function liveStanding(resultId, teamId, teamName, total, officialPosition, active = false) {
  return {
    resultId,
    teamId,
    teamName,
    total,
    officialPosition,
    positionStatus: "official",
    active
  };
}

function fixtureResult(resultId, teamId, teamName, officialPosition, officialTotal, overrides = {}) {
  return {
    resultId,
    teamId,
    teamName,
    categoryId: "aaa",
    categoryName: "AAA",
    competitionId: "equipos",
    competitionType: "equipos_completo",
    phaseId: "final",
    phaseName: "Final",
    charreadaId: "charreada-3",
    participantScope: "team",
    scores: {
      CC: 32,
      P: 26,
      C: 70,
      JT: 17,
      LC: 23,
      PR: 18,
      JY: 18,
      MP: 25,
      MC: 23,
      PM: 24
    },
    subtotal: officialTotal,
    teamPenaltyTotal: 0,
    officialTotal,
    officialPosition,
    positionStatus: "official",
    resultStatus: "published",
    publishedAt: "2026-07-27T17:59:50.000Z",
    sourceRevision: 1,
    displayOrder: officialPosition,
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
    charreadaId: fixtureUrl.searchParams.get("charreadaId") || "",
    scenario: fixtureUrl.searchParams.get("scenario") || "live"
  });
}
