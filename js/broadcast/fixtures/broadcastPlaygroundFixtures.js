export const PLAYGROUND_FIXTURE_VERSION = "1.0.0";

const TEAM_SUERTES = Object.freeze([
  "cala",
  "piales",
  "colas",
  "toro",
  "terna",
  "yegua",
  "manganas_pie",
  "manganas_caballo",
  "paso"
]);

const CHARRO_COMPLETO_SUERTES = Object.freeze([
  "cala",
  "piales",
  "colas",
  "toro",
  "manganas_pie",
  "manganas_caballo",
  "paso"
]);

export const PLAYGROUND_COMPETITIONS = Object.freeze({
  equipos_completo: Object.freeze({
    type: "equipos_completo",
    label: "Competencia por equipos",
    scope: "team",
    suerteIds: TEAM_SUERTES
  }),
  charro_completo: Object.freeze({
    type: "charro_completo",
    label: "Charro Completo",
    scope: "individual",
    suerteIds: CHARRO_COMPLETO_SUERTES
  }),
  caladero: Object.freeze({
    type: "caladero",
    label: "Caladero",
    scope: "individual",
    suerteIds: Object.freeze(["cala"])
  }),
  coleadero: Object.freeze({
    type: "coleadero",
    label: "Coleadero",
    scope: "individual",
    suerteIds: Object.freeze(["colas"])
  }),
  pialadero: Object.freeze({
    type: "pialadero",
    label: "Pialadero",
    scope: "individual",
    suerteIds: Object.freeze(["piales"])
  })
});

export const PLAYGROUND_COUNT_OPTIONS = Object.freeze([
  Object.freeze({ value: "one", label: "1 participante", count: 1 }),
  Object.freeze({ value: "two", label: "2 participantes", count: 2 }),
  Object.freeze({ value: "three", label: "3 equipos", count: 3 }),
  Object.freeze({ value: "four", label: "4 equipos", count: 4 }),
  Object.freeze({ value: "many", label: "5 o más elementos", count: 6 })
]);

export const PLAYGROUND_LAYER_IDS = Object.freeze([
  "background",
  "scoreboard",
  "turn",
  "score",
  "timer",
  "alerts",
  "sponsors",
  "fullscreen",
  "emergency"
]);

export const PLAYGROUND_OUTPUT_DEFINITIONS = Object.freeze([
  Object.freeze({
    id: "playground_preview",
    name: "Preview 1920 x 1080",
    type: "preview",
    resolution: Object.freeze({ width: 1920, height: 1080 }),
    safeArea: Object.freeze({ top: 54, right: 96, bottom: 54, left: 96, unit: "px" }),
    projectionView: "preview"
  }),
  Object.freeze({
    id: "playground_program",
    name: "Program 1920 x 1080",
    type: "program",
    resolution: Object.freeze({ width: 1920, height: 1080 }),
    safeArea: Object.freeze({ top: 54, right: 96, bottom: 54, left: 96, unit: "px" }),
    projectionView: "program"
  }),
  Object.freeze({
    id: "playground_vertical",
    name: "Vertical 1080 x 1920",
    type: "mobile_monitor",
    resolution: Object.freeze({ width: 1080, height: 1920 }),
    safeArea: Object.freeze({ top: 80, right: 54, bottom: 120, left: 54, unit: "px" }),
    projectionView: "program"
  }),
  Object.freeze({
    id: "playground_led",
    name: "LED panorámico 3840 x 720",
    type: "led",
    resolution: Object.freeze({ width: 3840, height: 720 }),
    safeArea: Object.freeze({ top: 36, right: 160, bottom: 36, left: 160, unit: "px" }),
    projectionView: "program"
  }),
  Object.freeze({
    id: "playground_locutor",
    name: "Monitor de locutor 1280 x 720",
    type: "locutor_monitor",
    resolution: Object.freeze({ width: 1280, height: 720 }),
    safeArea: Object.freeze({ top: 36, right: 64, bottom: 36, left: 64, unit: "px" }),
    projectionView: "program"
  })
]);

export const PLAYGROUND_GRAPHIC_DEFINITIONS = Object.freeze({
  "scoreboard-test": Object.freeze({
    graphicId: "scoreboard-test",
    label: "Marcador",
    type: "scoreboard",
    layerId: "scoreboard",
    requiredData: Object.freeze(["ranking.entries"]),
    position: Object.freeze({ x: 0.5, y: 0.82, anchor: "center", unit: "normalized" }),
    size: Object.freeze({ width: 0.82, height: 0.22, unit: "normalized" }),
    scale: 1,
    opacity: 1,
    visible: true,
    dataBindings: Object.freeze({ rows: "ranking.entries", title: "competition.name" }),
    fallback: "Marcador sin datos"
  }),
  "turn-test": Object.freeze({
    graphicId: "turn-test",
    label: "Turno",
    type: "turn",
    layerId: "turn",
    requiredData: Object.freeze(["competition.scope", "suerte.name"]),
    position: Object.freeze({ x: 0.08, y: 0.78, anchor: "bottom-left", unit: "normalized" }),
    size: Object.freeze({ width: 0.5, height: 0.16, unit: "normalized" }),
    scale: 1,
    opacity: 1,
    visible: true,
    dataBindings: Object.freeze({ team: "team.name", participant: "participant.name", suerte: "suerte.name" }),
    fallback: "Turno no disponible"
  }),
  "score-test": Object.freeze({
    graphicId: "score-test",
    label: "Calificación",
    type: "score",
    layerId: "score",
    requiredData: Object.freeze(["score.total"]),
    position: Object.freeze({ x: 0.86, y: 0.72, anchor: "center", unit: "normalized" }),
    size: Object.freeze({ width: 0.22, height: 0.22, unit: "normalized" }),
    scale: 1,
    opacity: 1,
    visible: true,
    dataBindings: Object.freeze({ total: "score.total", suerte: "suerte.name" }),
    fallback: "Sin calificación"
  }),
  "ranking-test": Object.freeze({
    graphicId: "ranking-test",
    label: "Ranking",
    type: "ranking",
    layerId: "fullscreen",
    requiredData: Object.freeze(["ranking.entries"]),
    position: Object.freeze({ x: 0.5, y: 0.5, anchor: "center", unit: "normalized" }),
    size: Object.freeze({ width: 0.78, height: 0.72, unit: "normalized" }),
    scale: 1,
    opacity: 1,
    visible: true,
    dataBindings: Object.freeze({ rows: "ranking.entries", title: "competition.name" }),
    fallback: "Ranking sin datos"
  }),
  "timer-test": Object.freeze({
    graphicId: "timer-test",
    label: "Cronómetro",
    type: "timer",
    layerId: "timer",
    requiredData: Object.freeze(["timer.display"]),
    position: Object.freeze({ x: 0.84, y: 0.12, anchor: "center", unit: "normalized" }),
    size: Object.freeze({ width: 0.26, height: 0.13, unit: "normalized" }),
    scale: 1,
    opacity: 1,
    visible: true,
    dataBindings: Object.freeze({ display: "timer.display", running: "timer.running" }),
    fallback: "00:00.0"
  }),
  "cala-detail-test": Object.freeze({
    graphicId: "cala-detail-test",
    label: "Detalle de Cala",
    type: "cala_detail",
    layerId: "score",
    requiredData: Object.freeze(["score.total", "scoreDetail"]),
    position: Object.freeze({ x: 0.5, y: 0.5, anchor: "center", unit: "normalized" }),
    size: Object.freeze({ width: 0.62, height: 0.48, unit: "normalized" }),
    scale: 1,
    opacity: 1,
    visible: true,
    dataBindings: Object.freeze({ detail: "scoreDetail", total: "score.total" }),
    fallback: "Detalle restringido o no disponible"
  }),
  "sponsor-test": Object.freeze({
    graphicId: "sponsor-test",
    label: "Patrocinador",
    type: "sponsor",
    layerId: "sponsors",
    requiredData: Object.freeze(["sponsor.active"]),
    position: Object.freeze({ x: 0.5, y: 0.88, anchor: "center", unit: "normalized" }),
    size: Object.freeze({ width: 0.28, height: 0.13, unit: "normalized" }),
    scale: 1,
    opacity: 1,
    visible: true,
    dataBindings: Object.freeze({ sponsor: "sponsor.active", assetId: "asset-sponsor" }),
    fallback: "Patrocinador"
  }),
  "message-test": Object.freeze({
    graphicId: "message-test",
    label: "Mensaje libre",
    type: "message",
    layerId: "alerts",
    requiredData: Object.freeze([]),
    position: Object.freeze({ x: 0.5, y: 0.15, anchor: "center", unit: "normalized" }),
    size: Object.freeze({ width: 0.56, height: 0.12, unit: "normalized" }),
    scale: 1,
    opacity: 1,
    visible: true,
    dataBindings: Object.freeze({ message: "payload.message" }),
    fallback: "Mensaje de producción"
  })
});

export const PLAYGROUND_ASSET_DEFINITIONS = Object.freeze([
  assetDefinition("asset-organization-logo", "Logo de organización", "logo", "organization", "public", "logos/organization.png", "organization"),
  assetDefinition("asset-tournament-logo", "Logo de torneo", "logo", "tournament", "public", "logos/tournament.png", "tournament"),
  assetDefinition("asset-sponsor", "Patrocinador principal", "sponsor", "tournament", "public", "sponsors/main.png", "sponsor"),
  assetDefinition("asset-participant-photo", "Foto de participante", "photo", "tournament", "production", "participants/current.png", "participant"),
  assetDefinition("asset-horse-photo", "Foto de caballo", "photo", "tournament", "production", "horses/current.png", "horse"),
  assetDefinition("asset-background", "Fondo de transmisión", "background", "organization", "production", "backgrounds/charropro.png", "background"),
  assetDefinition("asset-watermark", "Marca de agua", "watermark", "organization", "public", "logos/watermark.png", "watermark")
]);

export function buildPlaygroundFixture(competitionType = "equipos_completo", countOption = "three") {
  const competition = PLAYGROUND_COMPETITIONS[competitionType] || PLAYGROUND_COMPETITIONS.equipos_completo;
  const count = resolveFixtureCount(countOption, competition.scope);
  const entities = competition.scope === "team" ? buildTeams(count) : buildParticipants(count, competition.type);
  const current = entities[0];
  const suerteId = currentSuerteId(competition.type);
  const scoreTotal = competition.type === "caladero" ? 42 : competition.type === "coleadero" ? 36 : competition.type === "pialadero" ? 48 : 32;
  const timestamp = "2026-07-13T18:30:00.000Z";
  const source = {
    revision: 7,
    tournament: {
      id: "torneo_playground",
      name: "Campeonato CharroPro de Prueba",
      type: "completo",
      status: "en_vivo",
      startDate: "2026-07-13",
      venue: "Lienzo Charro de Pruebas",
      city: "Guadalajara",
      state: "Jalisco",
      country: "México",
      organizerName: "CharroPro"
    },
    organization: {
      id: "organizacion_playground",
      name: "Orgullo Charro",
      shortName: "OC",
      tenantId: "tenant_playground",
      clientId: "cliente_playground"
    },
    competition: {
      id: competition.type,
      type: competition.type,
      name: competition.label,
      scope: competition.scope,
      category: "Libre",
      phase: "Final",
      status: "en_vivo",
      suerteIds: [...competition.suerteIds],
      participantCount: competition.scope === "individual" ? entities.length : null,
      teamCount: competition.scope === "team" ? entities.length : null
    },
    charreada: {
      id: `jornada_${competition.type}`,
      name: competition.scope === "team" ? "Charreada de campeonato" : `Jornada de ${competition.label}`,
      status: "en_vivo",
      date: "2026-07-13",
      startTime: "18:00",
      order: 1,
      phase: "Final",
      category: "Libre",
      active: true,
      competitionId: competition.type,
      competitionType: competition.type,
      suerteIds: [...competition.suerteIds]
    },
    suerte: {
      id: suerteId,
      name: suerteLabel(suerteId),
      order: competition.suerteIds.indexOf(suerteId) + 1,
      status: "en_curso",
      active: true,
      completed: false,
      attempt: 1,
      maxAttempts: 3
    },
    score: {
      id: `score_${competition.type}_1`,
      basePoints: scoreTotal,
      additionalPoints: 0,
      infractions: 0,
      penalties: 0,
      teamPenalties: 0,
      total: scoreTotal,
      status: "published",
      published: true,
      timestamp,
      participantId: competition.scope === "individual" ? current.id : null,
      teamId: competition.scope === "team" ? current.id : null,
      suerteId,
      competitionId: competition.type,
      competitionType: competition.type,
      participantScope: competition.scope,
      attempts: buildAttempts(competition.type)
    },
    scoreDetail: buildScoreDetail(competition.type, scoreTotal),
    ranking: {
      scope: competition.scope,
      type: competition.type,
      currentPosition: 1,
      total: current.total,
      entries: entities.map((entry, index) => ({
        id: entry.id,
        participantId: competition.scope === "individual" ? entry.id : null,
        participantName: competition.scope === "individual" ? entry.name : null,
        teamId: competition.scope === "team" ? entry.id : null,
        teamName: competition.scope === "team" ? entry.name : null,
        name: entry.name,
        position: index + 1,
        total: entry.total,
        category: entry.category,
        association: entry.association
      }))
    },
    timer: {
      id: `timer_${competition.type}`,
      value: 34200,
      elapsed: 34200,
      remaining: 25800,
      running: true,
      paused: false,
      startedAt: "2026-07-13T18:29:25.800Z",
      updatedAt: timestamp,
      limit: 60000,
      status: "running",
      display: "00:34.2",
      revision: 12,
      source: { type: "playground", operatorId: "operador_playground" }
    },
    sponsor: {
      active: {
        id: "patrocinador_1",
        name: "Patrocinador de Prueba",
        campaign: "Final 2026",
        scope: "tournament",
        priority: 1,
        active: true,
        metadata: { internalContact: "produccion@ejemplo.invalid" }
      },
      list: [
        { id: "patrocinador_1", name: "Patrocinador de Prueba", active: true, priority: 1 }
      ]
    },
    branding: {
      themeId: "charropro_gold",
      primaryColor: "#d6ad43",
      secondaryColor: "#1b1d20",
      accentColor: "#2f80ed",
      backgroundColor: "#0b0c0e",
      textColor: "#f4f5f7",
      logo: "asset-tournament-logo",
      watermark: "asset-watermark"
    },
    production: {
      sessionId: "session_playground",
      outputId: "playground_preview",
      outputType: "preview",
      mode: "manual",
      automationEnabled: false,
      operatorId: "operador_playground",
      operatorName: "Operador de prueba",
      judgeId: "juez_playground",
      judgeName: "Juez de prueba",
      updatedAt: timestamp
    },
    system: {
      status: "ready",
      diagnostics: {
        tenantId: "tenant_playground",
        internalToken: "fixture-only-not-a-secret",
        source: "local"
      }
    },
    generatedAt: timestamp
  };

  if (competition.scope === "team") {
    source.team = {
      ...current,
      teamId: current.id,
      active: true,
      members: [
        { id: "charro_equipo_1", name: "José de la Torre", role: "Capitán" }
      ]
    };
    source.participant = {
      id: "charro_equipo_1",
      name: "José de la Torre",
      scope: "team",
      category: "AAA",
      association: current.association,
      active: true
    };
    source.charro = {
      id: "charro_equipo_1",
      name: "José de la Torre",
      association: current.association,
      category: "AAA",
      active: true
    };
  } else {
    source.participant = {
      ...current,
      participantId: current.id,
      scope: "individual",
      active: true
    };
    source.charro = {
      id: current.id,
      name: current.name,
      association: current.association,
      category: current.category,
      active: true
    };
    source.horse = {
      id: current.horseId,
      name: current.horseName,
      owner: "Propietario de prueba",
      category: current.category,
      active: true
    };
  }

  return cloneFixture(source);
}

export function getPlaygroundCompetition(type) {
  const competition = PLAYGROUND_COMPETITIONS[type] || PLAYGROUND_COMPETITIONS.equipos_completo;
  return cloneFixture(competition);
}

export function getPlaygroundGraphicDefinition(graphicId) {
  const definition = PLAYGROUND_GRAPHIC_DEFINITIONS[graphicId] || PLAYGROUND_GRAPHIC_DEFINITIONS["scoreboard-test"];
  return cloneFixture(definition);
}

function buildTeams(count) {
  const names = [
    "Rancho El Laurel",
    "Tres Regalos",
    "Hacienda de Guadalupe",
    "Cuenca del Papaloapan",
    "Charros de Jalisco",
    "Rancho Las Cuatas"
  ];
  return Array.from({ length: count }, (_, index) => ({
    id: `equipo_${index + 1}`,
    name: names[index] || `Equipo ${index + 1}`,
    shortName: `EQ${index + 1}`,
    category: "AAA",
    association: index % 2 === 0 ? "Jalisco" : "Nacional",
    total: 318 - (index * 7),
    position: index + 1,
    order: index + 1,
    logo: `asset-team-${index + 1}`
  }));
}

function buildParticipants(count, type) {
  const names = ["Alejandro Montaño", "Rafael Padilla", "Emilio Sánchez", "Carlos Orozco", "Diego Ibarra", "Martín Reynoso"];
  const horses = ["Lucero", "Centenario", "Relámpago", "Alazán", "Caporal", "Valiente"];
  return Array.from({ length: count }, (_, index) => ({
    id: `participante_${type}_${index + 1}`,
    name: names[index] || `Participante ${index + 1}`,
    scope: "individual",
    category: index % 2 === 0 ? "Libre" : "Juvenil",
    association: index % 2 === 0 ? "Jalisco" : "Nayarit",
    horseId: `caballo_${type}_${index + 1}`,
    horseName: horses[index] || `Caballo ${index + 1}`,
    total: 186 - (index * 6),
    position: index + 1,
    order: index + 1
  }));
}

function buildAttempts(type) {
  if (type === "coleadero") {
    return [
      { attempt: 1, total: 14, status: "valid" },
      { attempt: 2, total: 12, status: "valid" },
      { attempt: 3, total: 10, status: "valid" }
    ];
  }
  if (type === "pialadero") {
    return [
      { attempt: 1, total: 22, status: "valid" },
      { attempt: 2, total: 26, status: "valid" },
      { attempt: 3, total: 0, status: "valid" }
    ];
  }
  return [{ attempt: 1, total: 32, status: "valid" }];
}

function buildScoreDetail(type, total) {
  if (type === "caladero") {
    return {
      breakdown: { base: 20, additional: 24, infractions: 2, total },
      cala: {
        punta: 8,
        lados: 10,
        mediosLados: 8,
        ceja: 6,
        retroceso: 12
      },
      notes: "Fixture controlado de Cala"
    };
  }
  if (type === "coleadero" || type === "pialadero") {
    return {
      breakdown: { total },
      attempts: buildAttempts(type)
    };
  }
  return {
    breakdown: { base: total, additional: 0, infractions: 0, total }
  };
}

function currentSuerteId(type) {
  if (type === "caladero") return "cala";
  if (type === "coleadero") return "colas";
  if (type === "pialadero") return "piales";
  return type === "charro_completo" ? "piales" : "cala";
}

function suerteLabel(id) {
  return {
    cala: "Cala de Caballo",
    piales: "Piales en el Lienzo",
    colas: "Colas",
    toro: "Jineteo de Toro",
    terna: "Terna",
    yegua: "Jineteo de Yegua",
    manganas_pie: "Manganas a Pie",
    manganas_caballo: "Manganas a Caballo",
    paso: "Paso de la Muerte"
  }[id] || id;
}

function resolveFixtureCount(value, scope) {
  const selected = PLAYGROUND_COUNT_OPTIONS.find((item) => item.value === value);
  if (selected) return selected.count;
  return scope === "team" ? 3 : 2;
}

function assetDefinition(assetId, name, type, scope, visibility, fileName, category) {
  const checksum = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
  const scopeIds = {
    organizationId: ["organization", "tournament", "competition"].includes(scope) ? "organizacion_playground" : null,
    tournamentId: ["tournament", "competition"].includes(scope) ? "torneo_playground" : null,
    competitionId: scope === "competition" ? "equipos_completo" : null
  };
  return Object.freeze({
    assetId,
    assetFamilyId: assetId,
    name,
    type,
    mimeType: "image/png",
    extension: "png",
    status: "published",
    visibility,
    scope,
    tenantId: "tenant_playground",
    ...scopeIds,
    ownerId: "owner_playground",
    ownerName: "CharroPro",
    storageRef: `playground/${fileName}`,
    sourceType: "storage",
    checksum,
    checksumAlgorithm: "sha256",
    integrityStatus: "verified",
    verifiedAt: "2026-07-13T18:00:00.000Z",
    verifiedBy: Object.freeze({ userId: "owner_playground", name: "CharroPro" }),
    version: "1.0.0",
    revision: 0,
    dimensions: Object.freeze({ width: 1200, height: 800, aspectRatio: "3:2", hasAlpha: true }),
    tags: Object.freeze(["playground", category]),
    categories: Object.freeze([category]),
    fallbackVariantId: `${assetId}-original`,
    fallbackStrategy: "placeholder",
    rights: Object.freeze({
      owner: "CharroPro",
      licenseType: "fixture",
      allowedUses: Object.freeze(["broadcast", "public_display"]),
      commercialUse: true,
      broadcastUse: true,
      publicDisplay: true,
      derivativesAllowed: false
    }),
    variants: Object.freeze([
      Object.freeze({
        variantId: `${assetId}-original`,
        type: "original",
        name: "Original",
        storageRef: `playground/${fileName}`,
        mimeType: "image/png",
        extension: "png",
        width: 1200,
        height: 800,
        aspectRatio: "3:2",
        checksum,
        checksumAlgorithm: "sha256",
        integrityStatus: "verified",
        status: "approved",
        visibility,
        outputTypes: Object.freeze([]),
        orientation: "landscape",
        quality: 100,
        metadata: Object.freeze({ fixture: true })
      }),
      Object.freeze({
        variantId: `${assetId}-preview`,
        type: "preview",
        name: "Preview",
        storageRef: `playground/preview/${fileName}`,
        mimeType: "image/png",
        extension: "png",
        width: 600,
        height: 400,
        aspectRatio: "3:2",
        checksum,
        checksumAlgorithm: "sha256",
        integrityStatus: "verified",
        status: "approved",
        visibility,
        outputTypes: Object.freeze(["preview"]),
        orientation: "landscape",
        quality: 80,
        metadata: Object.freeze({ fixture: true })
      })
    ])
  });
}

function cloneFixture(value) {
  if (Array.isArray(value)) return value.map((item) => cloneFixture(item));
  if (!value || typeof value !== "object") return value;
  return Object.keys(value).reduce((output, key) => {
    output[key] = cloneFixture(value[key]);
    return output;
  }, {});
}
