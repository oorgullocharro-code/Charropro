import assert from "node:assert/strict";
import { buildCanonicalPublicProjectionV3 as buildBrowserProjection } from "../js/public/canonicalPublicProjectionV3.js?v=20260910-portal-v2-coleadero-sheet-opportunity-detail-001-v1";
import { buildCanonicalPublicProjectionV3 as buildFunctionProjection } from "../functions/reconciliationShared/public/canonicalPublicProjectionV3.js?v=20260910-portal-v2-coleadero-sheet-opportunity-detail-001-v1";
import { createPortalV2Model } from "../js/portalV2/portalV2Model.js?v=20260910-portal-v2-coleadero-sheet-opportunity-detail-001-v1";
import { createPortalV2Shell, renderPortalV2 } from "../js/portalV2/portalV2Render.js?v=20260910-portal-v2-coleadero-sheet-opportunity-detail-001-v1";

const NOW_MS = Date.parse("2026-09-11T00:00:00.000Z");

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

const projection = buildBoth(coleaderoSource());
assert.deepEqual(projection.browser, projection.functionProjection, "browser and reconciliation Function share one Coleadero sheet projection");

const competition = projection.browser.sheet.competitions[0];
const gustavo = competition.rows.find((row) => row.participantId === "participante-gustavo");
const sameNamedParticipant = competition.rows.find((row) => row.participantId === "participante-gustavo-2");
assert.equal(competition.opportunitiesPerParticipant, 3, "the slot limit is resolved from the assigned FMCH profile");
assert.deepEqual(gustavo.opportunities, [
  { opportunityNumber: 1, officialPoints: 15, status: "VALID" },
  { opportunityNumber: 2, officialPoints: 12, status: "VALID" }
]);
assert.equal(gustavo.total, 27, "the existing official total remains authoritative");
assert.equal(gustavo.opportunities.some((opportunity) => opportunity.opportunityNumber === 3), false, "an absent opportunity is not fabricated as zero");
assert.deepEqual(sameNamedParticipant.opportunities, [{ opportunityNumber: 1, officialPoints: 0, status: "VALID" }], "an official zero remains distinct from an absent slot");
assert.equal(sameNamedParticipant.horseId, "caballo-lucero");
assert.equal(competition.rows.length, 2, "same participant names remain separated by canonical individual identity");

const model = createPortalV2Model(projection.browser, { availability: "ready", view: "sabana", connection: "online" });
assert.equal(model.context.sheet[0].isColeaderoOpportunitySheet, true);
assert.deepEqual(model.context.sheet[0].rows[0].opportunities.map((item) => item.opportunityNumber), [1, 2]);
const rendered = renderText(model);
for (const label of ["Participante", "Caballo", "1ª", "2ª", "3ª", "Total", "Gustavo Mares", "Moro", "Lucero", "15", "12", "0", "27", "—"]) {
  assert.match(rendered, new RegExp(escapeRegex(label)), `Coleadero sheet renders ${label}`);
}

const teamProjection = buildBoth(teamSource());
assert.deepEqual(teamProjection.browser, teamProjection.functionProjection, "team projection parity remains unchanged");
assert.equal(teamProjection.browser.sheet.competitions[0].opportunitiesPerParticipant, undefined, "team sheets receive no individual opportunity slots");
assert.equal(teamProjection.browser.sheet.competitions[0].rows[0].opportunities, undefined, "team sheets receive no individual opportunity detail");
assert.equal(createPortalV2Model(teamProjection.browser, { availability: "ready", view: "sabana", connection: "online" }).context.sheet[0].isColeaderoOpportunitySheet, false);

console.log("portal-v2-coleadero-sheet-opportunity-detail.test.mjs: ok");

function buildBoth(source) {
  const options = { tournamentId: source.tournament.info.id, nowMs: NOW_MS };
  return {
    browser: buildBrowserProjection(source, options),
    functionProjection: buildFunctionProjection(source, options)
  };
}

function coleaderoSource() {
  const tournamentId = "coleadero-opportunity-sheet";
  const charreadaId = "lote-coleadero";
  return {
    tournament: {
      info: {
        id: tournamentId,
        nombre: "Coleadero de prueba",
        type: "coleadero",
        ruleProfileId: "FMCH_2026_LIBRE",
        ruleProfileVersion: "0.6.1",
        ruleProfileAssignment: {
          authorityVersion: "1.0.0",
          tournamentId,
          profileId: "FMCH_2026_LIBRE",
          version: "0.6.1",
          status: "active",
          contentFingerprint: "rptp_10e596046446e850",
          revision: 1
        }
      },
      publicModules: [{ type: "sheet", enabled: true, order: 50 }],
      participants: [
        { id: "participante-gustavo", participantName: "Gustavo Mares", horseId: "caballo-moro" },
        { id: "participante-gustavo-2", participantName: "Gustavo Mares", horseId: "caballo-lucero" }
      ],
      horses: [
        { id: "caballo-moro", displayName: "Moro" },
        { id: "caballo-lucero", displayName: "Lucero" }
      ],
      charreadas: [{
        id: charreadaId,
        competitionId: "coleadero",
        competitionType: "coleadero",
        competitionScope: "individual",
        participantIds: ["participante-gustavo", "participante-gustavo-2"],
        name: "Lote Coleadero"
      }],
      publishedScores: {
        "gustavo-1": officialRecord("gustavo-1", tournamentId, charreadaId, "participante-gustavo", 1, 15),
        "gustavo-2": officialRecord("gustavo-2", tournamentId, charreadaId, "participante-gustavo", 2, 12),
        "gustavo-2-zero": officialRecord("gustavo-2-zero", tournamentId, charreadaId, "participante-gustavo-2", 1, 0)
      },
      officialScoreLedger: {
        gustavo1: { activeRecordId: "gustavo-1", records: { "gustavo-1": officialRecord("gustavo-1", tournamentId, charreadaId, "participante-gustavo", 1, 15) } },
        gustavo2: { activeRecordId: "gustavo-2", records: { "gustavo-2": officialRecord("gustavo-2", tournamentId, charreadaId, "participante-gustavo", 2, 12) } },
        gustavo2: { activeRecordId: "gustavo-2-zero", records: { "gustavo-2-zero": officialRecord("gustavo-2-zero", tournamentId, charreadaId, "participante-gustavo-2", 1, 0) } }
      }
    },
    liveCurrent: { activeCharreadaId: charreadaId, status: "LIVE" }
  };
}

function teamSource() {
  const tournamentId = "team-sheet-unchanged";
  const charreadaId = "charreada-equipo";
  const record = {
    id: "score-equipo",
    revision: 1,
    total: 32,
    tournament: { id: tournamentId },
    charreada: { id: charreadaId, competitionId: "equipos_completo" },
    competition: { id: "equipos_completo", competitionScope: "team" },
    team: { id: "equipo-a", name: "Equipo A" },
    suerte: { id: "cala" },
    breakdown: { attemptV2: { identity: { tournamentId, charreadaId, competitionId: "equipos_completo", teamId: "equipo-a", suerteId: "cala", opportunityNumber: 1 }, scoring: { teamAdjustedPoints: 32 } } }
  };
  return {
    tournament: {
      info: { id: tournamentId, type: "equipos_completo" },
      publicModules: [{ type: "sheet", enabled: true, order: 50 }],
      teams: [{ id: "equipo-a", name: "Equipo A" }],
      charreadas: [{ id: charreadaId, competitionId: "equipos_completo", competitionScope: "team", teamIds: ["equipo-a"], name: "Charreada" }],
      publishedScores: { "score-equipo": record },
      officialScoreLedger: { equipo: { activeRecordId: "score-equipo", records: { "score-equipo": record } } }
    }
  };
}

function officialRecord(id, tournamentId, charreadaId, participantId, opportunityNumber, officialPoints) {
  return {
    id,
    revision: 1,
    total: 999,
    tournament: { id: tournamentId },
    charreada: { id: charreadaId, competitionId: "coleadero" },
    competition: { id: "coleadero", competitionScope: "individual", competitionType: "coleadero" },
    participant: { id: participantId },
    suerte: { id: "colas", type: "coleadero" },
    breakdown: {
      attemptV2: {
        identity: { tournamentId, charreadaId, competitionId: "coleadero", participantId, suerteId: "colas", opportunityNumber },
        sportState: { status: "VALID", opportunity: { number: opportunityNumber } },
        scoring: { teamAdjustedPoints: officialPoints, individualBadPoints: 0, teamBadPoints: 0 }
      }
    }
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

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
