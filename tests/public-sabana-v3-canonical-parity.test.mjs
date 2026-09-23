import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { buildCanonicalPublicProjectionV3 as buildBrowserProjection } from "../js/public/canonicalPublicProjectionV3.js?v=20260923-client-cache-version-recovery-fix-010-v1";
import { createCanonicalPublicTournamentData } from "../js/public/canonicalPublicTournamentData.js?v=20260923-client-cache-version-recovery-fix-010-v1";
import { createPortalV2Model } from "../js/portalV2/portalV2Model.js?v=20260923-client-cache-version-recovery-fix-010-v1";
import { getPublicSheetTitle } from "../js/portalV2/portalV2Render.js?v=20260923-client-cache-version-recovery-fix-010-v1";
import { buildCanonicalPublicProjectionV3 as buildFunctionProjection } from "../functions/reconciliationShared/public/canonicalPublicProjectionV3.js?v=20260923-client-cache-version-recovery-fix-010-v1";

const TOURNAMENT_ID = "public-sheet-parity";
const TEAM_COLUMNS = ["cala", "piales", "colas", "toro", "lazo", "pial_ruedo", "yegua", "manganas_pie", "manganas_caballo", "paso"];
const TEAM_LABELS = ["C", "P", "C", "T", "LC", "PR", "Y", "MP", "MC", "PM"];

test("public sheet preserves the resolved active ledger, canonical bad points, and Browser/Functions parity", () => {
  const source = fixture();
  const browser = buildBrowserProjection(source, { tournamentId: TOURNAMENT_ID, nowMs: Date.parse("2026-09-20T12:00:00.000Z") });
  const functions = buildFunctionProjection(source, { tournamentId: TOURNAMENT_ID, nowMs: Date.parse("2026-09-20T12:00:00.000Z") });
  assert.deepEqual(functions, browser);

  const result = browser.results.teams.find((item) => item.teamId === "team-a");
  const sheet = browser.sheet.competitions.find((item) => item.charreadaId === "charreada-one");
  assert.equal(result.columns.cala, 32, "the active ledger record replaces the stale score");
  assert.equal(result.columns.piales, 0, "official zero survives V3");
  assert.equal(result.badPoints, 9, "canonical bad points include official infractions and the canonical adjustment");
  assert.equal(sheet.rows[0].badPoints, 9);
  assert.equal(browser.results.teams.some((item) => item.teamId === "team-foreign"), false, "another tournament is excluded");
});

test("Portal sheet joins the published program roster without inventing results or duplicating official rows", () => {
  const snapshot = buildBrowserProjection(fixture(), { tournamentId: TOURNAMENT_ID, nowMs: Date.parse("2026-09-20T12:00:00.000Z") });
  const model = createPortalV2Model(snapshot, { availability: "ready", view: "sabana", phaseId: "phase-one" });
  const sheet = model.context.sheet.find((item) => item.charreadaId === "charreada-one");
  assert.deepEqual(sheet.columns.map((column) => column.key), TEAM_COLUMNS);
  assert.deepEqual(sheet.columns.map((column) => column.label), TEAM_LABELS);
  assert.deepEqual(sheet.rows.map((row) => row.teamId), ["team-a", "team-b"]);

  const scored = sheet.rows[0];
  const pending = sheet.rows[1];
  assert.equal(scored.hasOfficialResult, true);
  assert.equal(scored.total, 28);
  assert.equal(scored.badPoints, 9);
  assert.equal(scored.columns.find((column) => column.key === "piales").value, 0);
  assert.equal(pending.hasOfficialResult, false);
  assert.equal(pending.total, null, "a pending team does not receive an invented zero total");
  assert.equal(pending.badPoints, null, "a pending team does not receive invented bad points");
  assert.equal(pending.columns.length, 0, "absence remains distinct from official zero");
  assert.equal(sheet.rows.filter((row) => row.teamId === "team-a").length, 1);
});

test("an official total of zero remains distinct from a pending roster entry", () => {
  const source = fixture();
  source.tournament.charreadas = [source.tournament.charreadas[0]];
  source.tournament.charreadas[0].restas = {};
  source.tournament.publishedScores = [official("official-zero", "team-a", "charreada-one", "phase-one", "cala", 0)];
  source.tournament.officialScoreLedger = {};
  const snapshot = buildBrowserProjection(source, { tournamentId: TOURNAMENT_ID, nowMs: Date.parse("2026-09-20T12:00:00.000Z") });
  const model = createPortalV2Model(snapshot, { availability: "ready", view: "sabana", phaseId: "phase-one" });
  const [officialZero, pending] = model.context.sheet[0].rows;
  assert.equal(officialZero.hasOfficialResult, true);
  assert.equal(officialZero.total, 0);
  assert.equal(pending.hasOfficialResult, false);
  assert.equal(pending.total, null);
});

test("phase filtering keeps the matching roster and results isolated", () => {
  const snapshot = buildBrowserProjection(fixture(), { tournamentId: TOURNAMENT_ID, nowMs: Date.parse("2026-09-20T12:00:00.000Z") });
  const model = createPortalV2Model(snapshot, { availability: "ready", view: "sabana", phaseId: "phase-two" });
  assert.deepEqual(model.context.program.map((item) => item.charreadaId), ["charreada-two"]);
  assert.deepEqual(model.context.sheet.flatMap((item) => item.rows.map((row) => row.teamId)), ["team-c"]);
  assert.equal(model.context.sheet[0].rows[0].total, 20);
});

test("public sheet title uses resolved presentation context without changing sheet data", () => {
  const snapshot = buildBrowserProjection(fixture(), { tournamentId: TOURNAMENT_ID, nowMs: Date.parse("2026-09-20T12:00:00.000Z") });
  const phaseOne = createPortalV2Model(snapshot, { availability: "ready", view: "sabana", phaseId: "phase-one" });
  const phaseTwo = createPortalV2Model(snapshot, { availability: "ready", view: "sabana", phaseId: "phase-two" });

  assert.equal(getPublicSheetTitle(phaseOne.context.sheet[0].sheetPresentation), "Sábana — Fase 1");
  assert.equal(getPublicSheetTitle(phaseTwo.context.sheet[0].sheetPresentation), "Sábana — Final");

  const productionShape = phaseNamesWithoutIds(snapshot, ["Fase 1", "Fase 2"]);
  const general = createPortalV2Model(productionShape, { availability: "ready", view: "sabana" });
  assert.equal(general.context.selectedPhaseId, "");
  assert.deepEqual(general.context.sheet.map((competition) => competition.sheetPresentation), [
    { scope: "phase", phaseId: "", phaseName: "Fase 1" },
    { scope: "phase", phaseId: "", phaseName: "Fase 2" }
  ]);
  assert.deepEqual(general.context.sheet.map((competition) => getPublicSheetTitle(competition.sheetPresentation)), [
    "Sábana — Fase 1",
    "Sábana — Fase 2"
  ]);

  const trueGeneral = phaseNamesWithoutIds(snapshot, [""]);
  const generalOnly = createPortalV2Model(trueGeneral, { availability: "ready", view: "sabana" });
  assert.equal(getPublicSheetTitle(generalOnly.context.sheet[0].sheetPresentation), "Sábana General");

  const customSource = fixture();
  const finalCharreada = customSource.tournament.charreadas.find((item) => item.id === "charreada-two");
  finalCharreada.competitionId = "equipos-final";
  finalCharreada.phaseName = "Eliminatoria A";
  customSource.tournament.publishedScores.find((item) => item.id === "final-cala").competitionId = "equipos-final";
  const customSnapshot = buildBrowserProjection(customSource, { tournamentId: TOURNAMENT_ID, nowMs: Date.parse("2026-09-20T12:00:00.000Z") });
  const competitionScoped = createPortalV2Model(customSnapshot, { availability: "ready", view: "sabana", competitionId: "equipos-final" });
  assert.equal(competitionScoped.context.selectedPhaseId, "", "the presentation context does not require a raw phase route");
  assert.deepEqual(competitionScoped.context.sheet[0].sheetPresentation, { scope: "phase", phaseId: "phase-two", phaseName: "Eliminatoria A" });
  assert.equal(getPublicSheetTitle(competitionScoped.context.sheet[0].sheetPresentation), "Sábana — Eliminatoria A");

  finalCharreada.phaseName = "Semifinal";
  const liveSnapshot = buildBrowserProjection(customSource, { tournamentId: TOURNAMENT_ID, nowMs: Date.parse("2026-09-20T12:01:00.000Z") });
  const afterLiveUpdate = createPortalV2Model(liveSnapshot, { availability: "ready", view: "sabana", competitionId: "equipos-final" });
  assert.equal(getPublicSheetTitle(afterLiveUpdate.context.sheet[0].sheetPresentation), "Sábana — Semifinal");
  assert.equal(phaseOne.context.sheet[0].rows[0].total, 28, "title rendering does not alter official sporting data");
});

function phaseNamesWithoutIds(snapshot, phaseNames) {
  const next = structuredClone(snapshot);
  for (const [index, competition] of next.sheet.competitions.entries()) {
    competition.phase = "";
    competition.phaseName = phaseNames[index] || "";
  }
  next.sheet.competitions = next.sheet.competitions.slice(0, phaseNames.length);
  return createCanonicalPublicTournamentData(next);
}

test("public sheet renderer keeps the empty logo slot structural and presentation-only", async () => {
  const [contextSource, rendererSource, css] = await Promise.all([
    readFile(new URL("../js/portalV2/portalV2ContextModel.js", import.meta.url), "utf8"),
    readFile(new URL("../js/portalV2/portalV2Render.js", import.meta.url), "utf8"),
    readFile(new URL("../css/portal-v2.css", import.meta.url), "utf8")
  ]);
  assert.match(contextSource, /teamIds/);
  assert.equal(contextSource.includes("logoUrl"), false, "Portal roster does not promote a legacy logo");
  assert.equal(contextSource.includes("reduce("), false, "Portal does not recalculate public values");
  assert.equal(rendererSource.includes("reduce("), false, "renderer does not recalculate public values");
  assert.match(rendererSource, /renderSheetTeamCell/);
  assert.match(rendererSource, /portal-v2-sheet-team-cell__logo-slot/);
  assert.match(rendererSource, /item\.hasOfficialResult \? formatNumber\(item\.total\) : "—"/);
  assert.match(rendererSource, /competition\.isPublicTeamSheet \? \["Inf T"\]/);
  assert.match(css, /portal-v2-sheet-team-cell__logo-slot:empty \{ display: none; \}/);
});

function fixture() {
  const scores = [
    official("cala-old", "team-a", "charreada-one", "phase-one", "cala", 15, { revision: 1, timestampMs: 10, badPoints: 1 }),
    official("cala-current", "team-a", "charreada-one", "phase-one", "cala", 32, { revision: 2, timestampMs: 20, badPoints: 5 }),
    official("piales-zero", "team-a", "charreada-one", "phase-one", "piales", 0, { attemptIndex: 1, timestampMs: 30 }),
    official("final-cala", "team-c", "charreada-two", "phase-two", "cala", 20, { timestampMs: 40 }),
    official("foreign", "team-foreign", "charreada-foreign", "phase-foreign", "cala", 99, { tournamentId: "other-tournament", timestampMs: 50 })
  ];
  return {
    tournament: {
      info: {
        id: TOURNAMENT_ID,
        nombre: "Sábana pública",
        status: "live",
        type: "equipos_completo"
      },
      publicModules: [{ type: "sheet", enabled: true, order: 1 }],
      teams: [
        { id: "team-a", name: "Rancho A" },
        { id: "team-b", name: "Rancho B" },
        { id: "team-c", name: "Rancho C" }
      ],
      charreadas: [
        {
          id: "charreada-one", competitionId: "equipos", competitionName: "Equipos", name: "Clasificatoria",
          phaseId: "phase-one", phaseName: "Fase 1", participantScope: "team", teamIds: ["team-a", "team-b"], restas: { "team-a": -4 }
        },
        {
          id: "charreada-two", competitionId: "equipos", competitionName: "Equipos", name: "Final",
          phaseId: "phase-two", phaseName: "Final", participantScope: "team", teamIds: ["team-c"]
        }
      ],
      publishedScores: scores,
      officialScoreLedger: {
        cala: { activeRecordId: "cala-current", records: { "cala-old": scores[0], "cala-current": scores[1] } }
      }
    },
    liveCurrent: { activeCharreadaId: "charreada-one", status: "LIVE" }
  };
}

function official(id, teamId, charreadaId, phaseId, suerteId, total, options = {}) {
  const tournamentId = options.tournamentId || TOURNAMENT_ID;
  return {
    id,
    tournamentId,
    charreadaId,
    competitionId: "equipos",
    phaseId,
    participantScope: "team",
    teamId,
    teamName: teamId === "team-a" ? "Rancho A" : teamId === "team-b" ? "Rancho B" : teamId === "team-c" ? "Rancho C" : "Foráneo",
    suerteId,
    attemptIndex: options.attemptIndex || 0,
    revision: options.revision || 1,
    timestampMs: options.timestampMs || 1,
    publishedAt: new Date(options.timestampMs || 1).toISOString(),
    total,
    breakdown: {
      attemptV2: {
        identity: { tournamentId, charreadaId, competitionId: "equipos", phaseId, participantScope: "team", teamId, suerteId },
        sportState: { opportunity: { number: 1, sharedOpportunityId: "" } },
        scoring: { teamAdjustedPoints: total, individualBadPoints: options.badPoints || 0, teamBadPoints: 0 }
      }
    }
  };
}

console.log("public-sabana-v3-canonical-parity.test.mjs: ok");
