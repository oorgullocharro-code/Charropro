import assert from "node:assert/strict";
import {
  buildPortalSheet,
  buildProgramFilters,
  buildPublicPortalModel,
  resolvePortalCompetitionId,
  selectPortalProgram,
  selectPortalResults
} from "../js/publicPortal/portalSelectors.js?v=20260831-official-ranking-authority-public-parity-001-v1";

const snapshot = buildSnapshot();
const defaultModel = buildPublicPortalModel(snapshot);
assert.equal(defaultModel.schemaVersion, 2);
assert.equal(defaultModel.selectedCompetitionId, "charro-libre", "active competition is initial selection");
assert.equal(defaultModel.live.turn.team.name, "Equipo B", "official turn comes from live.turn");
assert.equal(defaultModel.live.turn.participant.name, "");
assert.equal(defaultModel.live.turn.horse.name, "", "missing horse remains absent");
assert.equal(defaultModel.home.resultsCount, 6);
assert.equal(defaultModel.program.length, 4);
assert.deepEqual(defaultModel.programFilters.days.map((option) => option.value), [
  "2026-07-27",
  "2026-07-28",
  "2026-07-29"
]);
assert.deepEqual(defaultModel.programFilters.phases.map((option) => option.value), ["fase-1", "final"]);
assert.deepEqual(defaultModel.program[0].participants.map((participant) => participant.name), ["Equipo B", "Equipo A"]);
assert.equal("association" in defaultModel.program[0].participants[0], false);

assert.equal(resolvePortalCompetitionId(defaultModel.competitions, "missing", "equipos-aa"), "equipos-aa");
assert.equal(resolvePortalCompetitionId(defaultModel.competitions, "charro-juvenil", "equipos-aa"), "charro-juvenil");

const duplicateTypes = defaultModel.competitions.filter((item) => item.competitionType === "charro_completo");
assert.equal(duplicateTypes.length, 2);
assert.notEqual(duplicateTypes[0].displayName, duplicateTypes[1].displayName);
assert.deepEqual(duplicateTypes.map((item) => item.competitionId), ["charro-libre", "charro-juvenil"]);

const teamModel = buildPublicPortalModel(snapshot, { competitionId: "equipos-aa" });
assert.deepEqual(teamModel.results.map((row) => row.displayName), ["Equipo A", "Equipo B"]);
assert.deepEqual(teamModel.results.map((row) => row.officialTotal), [25, 40]);
assert.deepEqual(teamModel.results.map((row) => row.officialPosition), [2, 1]);
assert.equal(teamModel.results[0].scores.CC, 0, "valid zero is preserved");
assert.equal(teamModel.results[0].subtotal, 25);
assert.equal(teamModel.results[0].officialTotal, 25);
assert.deepEqual(teamModel.sheet.columns.map((column) => column.id), ["CC", "P"]);
assert.equal(teamModel.sheet.rows[0].scores.CC, 0);

const filtered = buildPublicPortalModel(snapshot, {
  competitionId: "equipos-aa",
  categoryId: "aa",
  phaseId: "fase-1",
  charreadaId: "charreada-equipos"
});
assert.equal(filtered.results.length, 2);
assert.equal(buildPublicPortalModel(snapshot, {
  competitionId: "equipos-aa",
  categoryId: "aaa"
}).results.length, 0);

const charroModel = buildPublicPortalModel(snapshot, { competitionId: "charro-libre" });
assert.equal(charroModel.results.length, 1);
assert.equal(charroModel.results[0].participantScope, "individual");
assert.equal(charroModel.results[0].displayName, "Ana Charra");
assert.equal(charroModel.results[0].teamId, "");
assert.deepEqual(charroModel.sheet.columns.map((column) => column.id), ["CC", "P", "C", "JT", "MP", "MC", "PM"]);
assert.equal(charroModel.sheet.columns.some((column) => ["LC", "PR", "JY"].includes(column.id)), false);
assert.equal(charroModel.sheet.rows[0].scores.PM, 24);
assert.equal(charroModel.sheet.rows[0].teamPenaltyTotal, -4);
assert.equal("association" in charroModel.results[0], false);

const caladeroModel = buildPublicPortalModel(snapshot, { competitionId: "caladero-libre" });
assert.deepEqual(caladeroModel.sheet.columns.map((column) => column.id), ["CC"]);
assert.equal(caladeroModel.sheet.participantLabel, "Participante");
assert.equal(caladeroModel.results[0].officialTotal, null, "missing official total does not become zero or subtotal");
assert.equal(caladeroModel.results[0].subtotal, 38);

const directFilter = selectPortalResults(defaultModel.allResults, {
  competitionId: "charro-juvenil",
  categoryId: "juvenil",
  phaseId: "final"
});
assert.equal(directFilter.length, 1);
assert.equal(directFilter[0].displayName, "Luis Charro");

const noScoreColumns = buildPortalSheet([{
  resultId: "empty",
  displayName: "Sin captura",
  scores: {},
  officialTotal: null,
  officialPosition: null
}], {
  competitionScope: "individual",
  suerteIds: ["cala", "piales"]
});
assert.deepEqual(noScoreColumns.columns.map((column) => column.id), ["CC", "P"]);
assert.equal(noScoreColumns.rows[0].scores.CC, null, "absence remains empty");
assert.equal(noScoreColumns.showPenalty, true);
assert.equal(noScoreColumns.rows[0].officialTotal, null);
const absentPm = buildPortalSheet([{
  resultId: "pm-absent",
  displayName: "Sin Paso",
  scores: {},
  teamPenaltyTotal: null,
  officialTotal: null,
  officialPosition: null
}], {
  competitionScope: "team",
  suerteIds: ["paso"]
});
assert.deepEqual(absentPm.columns.map((column) => column.id), ["PM"]);
assert.equal(absentPm.rows[0].scores.PM, null);

const combinedProgram = buildPublicPortalModel(snapshot, {
  programDay: "2026-07-28",
  programPhaseId: "final",
  charreadaId: "charreada-charro-libre"
});
assert.equal(combinedProgram.program.length, 2);
assert.deepEqual(combinedProgram.program.map((item) => item.charreadaId), [
  "charreada-charro-libre",
  "charreada-charro-juvenil"
]);
assert.equal(combinedProgram.activeProgramFilters.day, "2026-07-28");
assert.equal(combinedProgram.activeProgramFilters.phaseId, "final");
assert.equal(combinedProgram.programDetail?.charreadaId, "charreada-charro-libre");
assert.equal(combinedProgram.programFeatured?.charreadaId, "charreada-charro-libre");
assert.equal(buildPublicPortalModel(snapshot, {
  programDay: "2026-07-28",
  charreadaId: "charreada-equipos"
}).programDetail, null);
const invalidProgramFilter = buildPublicPortalModel(snapshot, {
  programDay: "2099-01-01",
  programPhaseId: "fase-inexistente"
});
assert.equal(invalidProgramFilter.activeProgramFilters.day, "");
assert.equal(invalidProgramFilter.activeProgramFilters.phaseId, "");
assert.equal(invalidProgramFilter.program.length, 4);
assert.equal(selectPortalProgram(defaultModel.programAll, { day: "2026-07-29" }).length, 1);
assert.equal(buildProgramFilters(defaultModel.programAll, { day: "2026-07-27" }).day, "2026-07-27");
const onePhaseSnapshot = structuredClone(snapshot);
for (const item of onePhaseSnapshot.program.items) {
  item.phaseId = "final";
  item.phaseName = "Final";
}
assert.deepEqual(
  buildPublicPortalModel(onePhaseSnapshot).programFilters.phases.map((option) => option.value),
  ["final"]
);

const empty = buildPublicPortalModel(null, { tournamentId: "torneo_1", availability: "loading" });
assert.equal(empty.availability, "loading");
assert.deepEqual(empty.competitions, []);
assert.deepEqual(empty.results, []);
assert.deepEqual(empty.program, []);

const legacy = buildPublicPortalModel({
  info: { id: "legacy", nombre: "Legacy" },
  competitions: [{ competitionId: "equipos_completo", competitionType: "equipos_completo", name: "Equipos" }],
  schedule: [],
  scoresheet: [],
  generatedAt: "2026-07-27T12:00:00.000Z"
});
assert.equal(legacy.schemaVersion, 1);
assert.equal(legacy.legacy, true);
assert.equal(legacy.selectedCompetitionId, "equipos_completo");
assert.deepEqual(legacy.programFilters.phases, []);

const legacyKeySuerte = buildPublicPortalModel({
  info: { id: "legacy-key", nombre: "Legacy Key" },
  activeCharreada: {
    id: "charreada-key",
    status: "en_vivo",
    currentTeam: { id: "team-key", name: "Equipo Key" },
    currentSuerte: { key: "CC" }
  },
  schedule: [],
  scoresheet: [],
  generatedAt: "2026-07-27T12:00:00.000Z"
});
assert.equal(legacyKeySuerte.live.status, "live");
assert.equal(legacyKeySuerte.live.turn.team.name, "Equipo Key");
assert.equal(legacyKeySuerte.live.turn.suerteId, "cala");
assert.equal(legacyKeySuerte.live.turn.suerteName, "Cala");

const legacyIdSuerte = buildPublicPortalModel({
  info: { id: "legacy-id", nombre: "Legacy ID" },
  activeCharreada: {
    id: "charreada-id",
    currentTeam: { id: "team-id", name: "Equipo ID" },
    currentSuerte: { id: "CC", name: "Cala de Caballo" }
  },
  schedule: [],
  scoresheet: []
});
assert.equal(legacyIdSuerte.live.turn.suerteId, "cala");
assert.equal(legacyIdSuerte.live.turn.suerteName, "Cala de Caballo");

const legacyNamedSuerte = buildPublicPortalModel({
  info: { id: "legacy-name", nombre: "Legacy Nombre" },
  activeCharreada: {
    id: "charreada-name",
    currentSuerte: { nombre: "Cala de Caballo" }
  },
  schedule: [],
  scoresheet: []
});
assert.equal(legacyNamedSuerte.live.turn.suerteId, "");
assert.equal(legacyNamedSuerte.live.turn.suerteName, "Cala de Caballo");

const legacyMissingSuerte = buildPublicPortalModel({
  info: { id: "legacy-missing", nombre: "Legacy Sin Suerte" },
  activeCharreada: { id: "charreada-missing" },
  schedule: [],
  scoresheet: []
});
assert.equal(legacyMissingSuerte.live.turn.suerteId, "");
assert.equal(legacyMissingSuerte.live.turn.suerteName, "");

const legacyPm = buildPublicPortalModel({
  info: { id: "legacy-pm", nombre: "Legacy PM" },
  competitions: [{
    competitionId: "equipos_completo",
    competitionType: "equipos_completo",
    name: "Equipos",
    scope: "team",
    suerteIds: ["paso"]
  }],
  schedule: [],
  scoresheet: [{
    teamId: "team-pm",
    teamName: "Equipo PM",
    competitionId: "equipos_completo",
    competitionType: "equipos_completo",
    pasoMuerte: 0,
    PEN: -4,
    TOTAL: 0,
    position: 1
  }],
  generatedAt: "2026-07-27T12:00:00.000Z"
});
assert.deepEqual(legacyPm.sheet.columns.map((column) => column.id), ["PM"]);
assert.equal(legacyPm.sheet.rows[0].scores.PM, 0, "legacy PM alias preserves official zero");
assert.equal(legacyPm.sheet.rows[0].teamPenaltyTotal, -4, "PM and PEN remain separate");

const maliciousSnapshot = structuredClone(snapshot);
maliciousSnapshot.program.items[0].name = "<script>alert(1)</script>";
maliciousSnapshot.program.items[0].venueName = "<img src=x onerror=alert(1)>";
maliciousSnapshot.program.items[0].participants[0].name = "<b>Equipo B</b>";
const maliciousModel = buildPublicPortalModel(maliciousSnapshot);
assert.equal(maliciousModel.programAll[0].name.includes("<"), false);
assert.equal(maliciousModel.programAll[0].venueName.includes("<"), false);
assert.equal(maliciousModel.programAll[0].participants[0].name.includes("<"), false);
const accessorCollection = {};
Object.defineProperty(accessorCollection, "unsafe", {
  enumerable: true,
  get() {
    throw new Error("accessor must not run");
  }
});
assert.deepEqual(buildProgramFilters(accessorCollection), {
  days: [],
  phases: [],
  day: "",
  phaseId: ""
});

console.log("public-portal-selectors.test.mjs: ok");

function buildSnapshot() {
  return {
    schemaVersion: 2,
    projectionRevision: 9,
    generatedAt: "2026-07-27T18:00:00.000Z",
    sourceUpdatedAt: "2026-07-27T17:59:59.000Z",
    status: "live",
    metadata: {
      revision: 1,
      status: "ready",
      tournamentId: "portal-core-qa",
      name: "Campeonato Nacional",
      visibility: "public",
      generatedAt: "2026-07-27T18:00:00.000Z"
    },
    overview: {
      revision: 3,
      status: "live",
      name: "Campeonato Nacional",
      venue: "Lienzo QA",
      startDate: "2026-07-27T12:00:00.000Z",
      endDate: "2026-07-29T12:00:00.000Z",
      activeCompetitionId: "charro-libre",
      activeCharreadaId: "charreada-charro-libre",
      activeCompetitionName: "Charro Completo Libre",
      activeCharreadaName: "Final Charro Completo",
      turn: {
        status: "available",
        teamId: "team-b",
        teamName: "Equipo B",
        participantId: "",
        participantName: "",
        suerteId: "piales",
        suerteName: "Piales"
      }
    },
    program: {
      revision: 2,
      status: "ready",
      items: [
        program("charreada-equipos", "equipos-aa", "equipos_completo", "Equipos AA", "aa", "fase-1"),
        program("charreada-charro-libre", "charro-libre", "charro_completo", "Charro Completo Libre", "libre", "final"),
        program("charreada-charro-juvenil", "charro-juvenil", "charro_completo", "Charro Completo Juvenil", "juvenil", "final"),
        program("charreada-caladero", "caladero-libre", "caladero", "Caladero Libre", "libre", "final")
      ]
    },
    live: {
      revision: 4,
      status: "live",
      competitionId: "charro-libre",
      charreadaId: "charreada-charro-libre",
      turn: {
        status: "available",
        team: { id: "team-b", name: "Equipo B", association: "Asociación Norte" },
        participant: { id: "", name: "" },
        horse: { id: "", name: "" },
        suerteId: "piales",
        suerteName: "Piales"
      },
      timer: { status: "available", timeMs: 0, timeText: "0:00", running: false },
      currentResult: null,
      standings: [],
      updatedAt: "2026-07-27T17:59:59.000Z"
    },
    competitions: {
      revision: 2,
      status: "ready",
      items: [
        competition("equipos-aa", "equipos_completo", "Equipos AA", "team", "aa", "fase-1", ["cala", "piales"], 1),
        competition("charro-libre", "charro_completo", "Charro Completo", "individual", "libre", "final", ["cala", "piales", "colas", "toro", "manganas_pie", "manganas_caballo", "paso"], 2),
        competition("charro-juvenil", "charro_completo", "Charro Completo", "individual", "juvenil", "final", ["cala", "piales", "colas", "toro", "manganas_pie", "manganas_caballo", "paso"], 3),
        competition("caladero-libre", "caladero", "Caladero Libre", "individual", "libre", "final", ["cala"], 4)
      ]
    },
    results: {
      revision: 5,
      status: "ready",
      scopes: {},
      items: [
        result("team-a", "Equipo A", "equipos-aa", "team", "aa", "fase-1", "charreada-equipos", { CC: 0, P: 25 }, 25, 25, 2, 1),
        result("team-b", "Equipo B", "equipos-aa", "team", "aa", "fase-1", "charreada-equipos", { CC: 20, P: 20 }, 40, 40, 1, 2),
        result("ana", "Ana Charra", "charro-libre", "individual", "libre", "final", "charreada-charro-libre", { CC: 42, P: 18, PM: 24 }, 84, 80, 1, 3),
        result("luis", "Luis Charro", "charro-juvenil", "individual", "juvenil", "final", "charreada-charro-juvenil", { CC: 35 }, 35, 35, null, 4),
        result("maria", "María Cala", "caladero-libre", "individual", "libre", "final", "charreada-caladero", { CC: 38 }, 38, null, null, 5),
        result("draft", "Borrador", "equipos-aa", "team", "aa", "fase-1", "charreada-equipos", { CC: 999 }, 999, 999, 1, 6, "draft")
      ]
    },
    rankings: { revision: 0, status: "unavailable", items: [] },
    statistics: { revision: 0, status: "unavailable", items: [] },
    search: { revision: 0, status: "unavailable", items: [] }
  };
}

function program(charreadaId, competitionId, competitionType, name, categoryId, phaseId) {
  const dates = {
    "charreada-equipos": "2026-07-27",
    "charreada-charro-libre": "2026-07-28",
    "charreada-charro-juvenil": "2026-07-28",
    "charreada-caladero": "2026-07-29"
  };
  const participants = charreadaId === "charreada-equipos"
    ? [
      { id: "team-b", type: "team", name: "Equipo B", order: 1, region: "Norte" },
      { id: "team-a", type: "team", name: "Equipo A", order: 2 },
      { id: "team-b", type: "team", name: "Duplicado", order: 3 }
    ]
    : [{ id: `${charreadaId}-participant`, type: "individual", name: name.replace("Charro Completo ", ""), order: 1 }];
  return {
    scheduleId: charreadaId,
    charreadaId,
    competitionId,
    competitionType,
    competitionScope: competitionType === "equipos_completo" ? "team" : "individual",
    competitionName: competitionType === "equipos_completo" ? "Competencia por equipos" : "Charro Completo",
    categoryId,
    categoryName: categoryId.toUpperCase(),
    phaseId,
    phaseName: phaseId === "final" ? "Final" : "Fase 1",
    name,
    scheduledDate: dates[charreadaId],
    scheduledTime: "15:00",
    endTime: "17:00",
    sequence: 1,
    order: 1,
    status: "upcoming",
    venueName: "Lienzo QA",
    participants,
    publicNotes: "Información pública",
    liveAvailable: charreadaId === "charreada-charro-libre",
    resultsAvailable: true,
    legacy: false
  };
}

function competition(competitionId, competitionType, name, scope, categoryId, phaseId, suerteIds, order) {
  return {
    competitionId,
    competitionType,
    name,
    competitionScope: scope,
    categoryId,
    phaseId,
    suerteIds,
    charreadaIds: [],
    order,
    status: "ready",
    legacy: false
  };
}

function result(id, name, competitionId, scope, categoryId, phaseId, charreadaId, scores, subtotal, officialTotal, position, displayOrder, status = "published") {
  return {
    resultId: `result-${id}`,
    teamId: scope === "team" ? id : null,
    teamName: scope === "team" ? name : "",
    participantId: scope === "individual" ? id : null,
    participantName: scope === "individual" ? name : "",
    horseId: null,
    horseName: "",
    categoryId,
    categoryName: categoryId.toUpperCase(),
    competitionId,
    competitionType: scope === "team" ? "equipos_completo" : competitionId.startsWith("caladero") ? "caladero" : "charro_completo",
    phaseId,
    phaseName: phaseId === "final" ? "Final" : "Fase 1",
    charreadaId,
    participantScope: scope,
    scores,
    subtotal,
    teamPenaltyTotal: id === "ana" ? -4 : null,
    officialTotal,
    officialPosition: position,
    positionStatus: position ? "official" : "unavailable",
    resultStatus: status,
    publishedAt: "2026-07-27T17:00:00.000Z",
    sourceRevision: 1,
    displayOrder
  };
}
