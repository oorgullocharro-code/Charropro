import assert from "node:assert/strict";
import {
  buildPortalSheet,
  buildPublicPortalModel,
  resolvePortalCompetitionId,
  selectPortalResults
} from "../js/publicPortal/portalSelectors.js";

const snapshot = buildSnapshot();
const defaultModel = buildPublicPortalModel(snapshot);
assert.equal(defaultModel.schemaVersion, 2);
assert.equal(defaultModel.selectedCompetitionId, "charro-libre", "active competition is initial selection");
assert.equal(defaultModel.live.turn.team.name, "Equipo B", "official turn comes from live.turn");
assert.equal(defaultModel.live.turn.participant.name, "");
assert.equal(defaultModel.live.turn.horse.name, "", "missing horse remains absent");
assert.equal(defaultModel.home.resultsCount, 6);
assert.equal(defaultModel.program.length, 4);

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
assert.deepEqual(charroModel.sheet.columns.map((column) => column.id), ["CC", "P"]);
assert.equal(charroModel.sheet.columns.some((column) => ["LC", "PR", "JY"].includes(column.id)), false);

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
  association: "",
  scores: {},
  officialTotal: null,
  officialPosition: null
}], {
  competitionScope: "individual",
  suerteIds: ["cala", "piales"]
});
assert.deepEqual(noScoreColumns.columns, [], "empty projected columns are not invented");
assert.equal(noScoreColumns.rows[0].officialTotal, null);

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
        result("ana", "Ana Charra", "charro-libre", "individual", "libre", "final", "charreada-charro-libre", { CC: 42, P: 18 }, 60, 60, 1, 3),
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
  return {
    scheduleId: charreadaId,
    charreadaId,
    competitionId,
    competitionType,
    categoryId,
    phaseId,
    phaseName: phaseId === "final" ? "Final" : "Fase 1",
    name,
    scheduledDate: "2026-07-27T12:00:00.000Z",
    scheduledTime: "15:00",
    order: 1,
    status: "upcoming",
    participants: [],
    association: "",
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
    association: "Asociación QA",
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
    teamPenaltyTotal: null,
    officialTotal,
    officialPosition: position,
    positionStatus: position ? "official" : "unavailable",
    resultStatus: status,
    publishedAt: "2026-07-27T17:00:00.000Z",
    sourceRevision: 1,
    displayOrder
  };
}
