import assert from "node:assert/strict";
import test from "node:test";
import { createCanonicalPublicTournamentData } from "../js/public/canonicalPublicTournamentData.js?v=20260910-portal-v2-coleadero-sheet-opportunity-detail-001-v1";
import { createPortalV2Model } from "../js/portalV2/portalV2Model.js?v=20260910-portal-v2-coleadero-sheet-opportunity-detail-001-v1";
import { createPortalV2Shell, renderPortalV2 } from "../js/portalV2/portalV2Render.js?v=20260910-portal-v2-coleadero-sheet-opportunity-detail-001-v1";

test("individual Portal V2 presentation uses only the published scope, participant, and horse identity", () => {
  const snapshot = individualSnapshot();
  assert.equal(snapshot.program.items[0].participantScope, "individual");
  assert.equal(snapshot.live.participantScope, "individual");
  assert.equal(snapshot.live.currentHorseId, "caballo_mtvxkwz8_5648o8");
  assert.equal(snapshot.live.currentHorseName, "Moro");

  for (const view of ["inicio", "en-vivo", "programa", "resultados", "posiciones", "sabana"]) {
    const model = createPortalV2Model(snapshot, { availability: "ready", view, connection: "online" });
    const rendered = renderText(model);
    assert.match(rendered, /Gustavo Mares/, `${view} retains the canonical participant`);
    assert.match(rendered, /Moro/, `${view} retains the canonical horse`);
    assert.doesNotMatch(rendered, /Equipo/, `${view} does not apply team semantics to an individual competition`);
  }

  const model = createPortalV2Model(snapshot, { availability: "ready", view: "sabana", connection: "online" });
  assert.equal(model.context.results[0].participantScope, "individual");
  assert.equal(model.context.standings[0].participantScope, "individual");
  assert.equal(model.context.sheet[0].rows[0].participantScope, "individual", "sheet scope is joined by canonical resultId");
  assert.equal(model.context.sheet[0].rows[0].horseId, "caballo_mtvxkwz8_5648o8");
  assert.equal(model.context.results[0].total, 27);
});

test("team Portal V2 presentation remains team-scoped and does not require participant or horse identity", () => {
  const snapshot = teamSnapshot();
  for (const view of ["inicio", "en-vivo", "programa", "resultados", "posiciones", "sabana"]) {
    const model = createPortalV2Model(snapshot, { availability: "ready", view, connection: "online" });
    const rendered = renderText(model);
    assert.equal(model.context.results[0]?.participantScope || "team", "team", `${view} preserves team scope`);
    assert.equal(model.context.results[0]?.teamName || "Rancho Los Laureles", "Rancho Los Laureles", `${view} preserves team identity`);
    assert.match(rendered, /Rancho Los Laureles/, `${view} renders the established team identity`);
    assert.doesNotMatch(rendered, /Caballo:/, `${view} does not add individual horse semantics to teams`);
  }
  const live = createPortalV2Model(snapshot, { availability: "ready", view: "en-vivo", connection: "online" });
  assert.equal(live.liveTimeline.live.participantScope, "team");
  assert.match(renderText(live), /Equipo/);
  assert.doesNotMatch(renderText(live), /Caballo:/);
});

function individualSnapshot() {
  return createCanonicalPublicTournamentData({
    tournamentId: "torneo-individual-portal-v2",
    sourceRevision: 27,
    projectionRevision: 27,
    generatedAt: "2026-09-10T20:00:00.000Z",
    lifecycle: { status: "LIVE" },
    tournament: { id: "torneo-individual-portal-v2", name: "Coleadero Individual" },
    modules: [
      { type: "live", enabled: true, order: 10 },
      { type: "program", enabled: true, order: 20 },
      { type: "results", enabled: true, order: 30 },
      { type: "standings", enabled: true, order: 40 },
      { type: "sheet", enabled: true, order: 50 }
    ],
    program: { items: [{
      id: "lote-coleadero", charreadaId: "lote-coleadero", competitionId: "coleadero", competitionName: "Coleadero",
      name: "Lote Coleadero", scheduledDate: "2026-09-10", scheduledTime: "10:00", status: "En curso", order: 1,
      participantScope: "individual", participantIds: ["participante_mtvxkwz8_47lshd"], participantNames: ["Gustavo Mares"],
      horseIds: ["caballo_mtvxkwz8_5648o8"], horseNames: ["Moro"]
    }] },
    live: {
      status: "LIVE", currentCharreada: "lote-coleadero", participantScope: "individual",
      currentParticipant: "Gustavo Mares", currentHorseId: "caballo_mtvxkwz8_5648o8", currentHorseName: "Moro",
      currentSuerte: "Colas", currentScore: 27, updatedAt: "2026-09-10T20:00:00.000Z"
    },
    results: { teams: [result()] },
    standings: { items: [standing()] },
    sheet: { competitions: [{
      competitionId: "coleadero", name: "Coleadero", charreadaId: "lote-coleadero",
      rows: [{ resultId: "resultado-gustavo", participantId: "participante_mtvxkwz8_47lshd", participantName: "Gustavo Mares", horseId: "caballo_mtvxkwz8_5648o8", horseName: "Moro", columns: { colas: 27 }, total: 27 }]
    }] },
    timeline: { items: [] },
    statistics: { status: "ready", items: [] }
  });
}

function teamSnapshot() {
  const snapshot = structuredClone(individualSnapshot());
  snapshot.tournament.name = "Charreada por Equipos";
  const program = snapshot.program.items[0];
  program.participantScope = "team";
  program.teamIds = ["equipo-laureles"];
  program.teamNames = ["Rancho Los Laureles"];
  delete program.participantIds;
  delete program.participantNames;
  delete program.horseIds;
  delete program.horseNames;
  Object.assign(snapshot.live, {
    participantScope: "team",
    currentTeam: "Rancho Los Laureles",
    currentParticipant: ""
  });
  delete snapshot.live.currentHorseId;
  delete snapshot.live.currentHorseName;
  for (const value of [snapshot.results.teams[0], snapshot.standings.items[0], snapshot.sheet.competitions[0].rows[0]]) {
    Object.assign(value, {
      participantScope: "team",
      teamId: "equipo-laureles",
      teamName: "Rancho Los Laureles"
    });
    delete value.participantId;
    delete value.participantName;
    delete value.horseId;
    delete value.horseName;
  }
  return createCanonicalPublicTournamentData(snapshot);
}

function result() {
  return {
    resultId: "resultado-gustavo", participantScope: "individual", participantId: "participante_mtvxkwz8_47lshd", participantName: "Gustavo Mares",
    horseId: "caballo_mtvxkwz8_5648o8", horseName: "Moro", charreadaId: "lote-coleadero", competitionId: "coleadero", competitionName: "Coleadero",
    columns: { colas: 27 }, penalties: 0, subtotal: 27, total: 27, status: "OFFICIAL", position: 1
  };
}

function standing() {
  return {
    rankingId: "ranking-gustavo", resultId: "resultado-gustavo", resultIds: ["resultado-gustavo"], position: 1, scopeType: "competition",
    competitionId: "coleadero", competitionName: "Coleadero", charreadaId: "lote-coleadero", participantScope: "individual",
    participantId: "participante_mtvxkwz8_47lshd", participantName: "Gustavo Mares", horseId: "caballo_mtvxkwz8_5648o8", horseName: "Moro",
    total: 27, classification: "official", status: "OFFICIAL"
  };
}

function renderText(model) {
  const previousDocument = globalThis.document;
  globalThis.document = new FakeDocument();
  try {
    const root = document.createElement("div");
    const shell = createPortalV2Shell(root);
    renderPortalV2(shell, model);
    return collectText(root).join("\n");
  } finally {
    globalThis.document = previousDocument;
  }
}

function collectText(node) {
  return [node.textContent, ...node.children.flatMap(collectText)].filter(Boolean);
}

class FakeDocument {
  createElement(tagName) { return new FakeNode(tagName); }
}

class FakeNode {
  constructor(tagName) {
    this.tagName = tagName;
    this.children = [];
    this.dataset = {};
    this.style = { setProperty() {} };
    this.textContent = "";
  }
  append(...nodes) { this.children.push(...nodes.filter(Boolean)); }
  prepend(...nodes) { this.children.unshift(...nodes.filter(Boolean)); }
  replaceChildren(...nodes) { this.children = nodes.filter(Boolean); }
  setAttribute() {}
}

console.log("portal-v2-individual-competition-presentation.test.mjs: ok");
