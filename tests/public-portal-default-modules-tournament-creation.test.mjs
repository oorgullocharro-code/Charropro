import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  applyDefaultPublicPortalModules,
  resolveDefaultPublicPortalModules
} from "../js/core/publicPortalModulePolicy.js?v=20260911-coleadero-excel-export-valid-xlsx-and-colas-sheet-001-v1";
import { buildCanonicalPublicProjectionV3 as buildBrowserProjection } from "../js/public/canonicalPublicProjectionV3.js?v=20260911-coleadero-excel-export-valid-xlsx-and-colas-sheet-001-v1";
import { buildCanonicalPublicProjectionV3 as buildFunctionProjection } from "../functions/reconciliationShared/public/canonicalPublicProjectionV3.js?v=20260911-coleadero-excel-export-valid-xlsx-and-colas-sheet-001-v1";
import { createPortalV2Model } from "../js/portalV2/portalV2Model.js?v=20260911-coleadero-excel-export-valid-xlsx-and-colas-sheet-001-v1";

const tournamentId = "public-portal-default-modules-creation";
const expectedTypes = ["live", "program", "results", "standings", "sheet"];

const createdTournament = applyDefaultPublicPortalModules(baseTournament());
assert.deepEqual(createdTournament.publicModules, resolveDefaultPublicPortalModules());
assert.deepEqual(createdTournament.publicModules.map((module) => module.type), expectedTypes);
assert.deepEqual(createdTournament.publicModules.map((module) => module.order), [10, 20, 30, 40, 50]);
assert.ok(createdTournament.publicModules.every((module) => module.enabled === true));
assert.equal(JSON.stringify(createdTournament.publicModules).match(/uid|email|role|audit|recovery/i), null);

const browserProjection = buildBrowserProjection({ tournament: createdTournament, liveCurrent: { activeCharreadaId: "charreada-a", status: "LIVE" } }, projectionOptions());
const functionProjection = buildFunctionProjection({ tournament: createdTournament, liveCurrent: { activeCharreadaId: "charreada-a", status: "LIVE" } }, projectionOptions());
assert.deepEqual(browserProjection.modules, createdTournament.publicModules, "V3 preserves persisted modules exactly");
assert.deepEqual(functionProjection.modules, browserProjection.modules, "Function mirror preserves the same modules");

const portal = createPortalV2Model(browserProjection, { availability: "ready", view: "sabana", connection: "online" });
assert.deepEqual(portal.navigation.map((item) => item.label), ["Inicio", "En vivo", "Programa", "Resultados", "Posiciones", "Sábana"]);
assert.equal(portal.navigation.some((item) => item.label === "Minuto a minuto"), false, "timeline remains inside En vivo");

const legacyTournament = baseTournament();
const legacyProjection = buildBrowserProjection({ tournament: legacyTournament, liveCurrent: { activeCharreadaId: "charreada-a", status: "LIVE" } }, projectionOptions());
const legacyPortal = createPortalV2Model(legacyProjection, { availability: "ready", view: "resultados", connection: "online" });
assert.deepEqual(legacyProjection.modules, [], "V3 keeps legacy tournaments without configured modules empty");
assert.deepEqual(legacyPortal.navigation.map((item) => item.label), ["Inicio"], "Portal does not invent legacy defaults");

const appSource = await readFile(new URL("../js/app.js", import.meta.url), "utf8");
assert.match(appSource, /applyDefaultPublicPortalModules\(applyProductiveRuleProfilePolicy\(applyLocalFmch2026RuleProfileDefault\(/, "saveTournament resolves modules through the creation chain");

console.log("public-portal-default-modules-tournament-creation.test.mjs: ok");

function baseTournament() {
  return {
    id: tournamentId,
    name: "Torneo de creación pública",
    status: "en_vivo",
    type: "equipos_completo",
    teams: [{ id: "team-a", name: "Equipo A" }],
    charreadas: [{ id: "charreada-a", competitionId: "equipos_completo", name: "Charreada A", status: "en_vivo", teamIds: ["team-a"] }],
    publishedScores: {
      scoreA: {
        id: "score-a", revision: 1, tournamentId, charreadaId: "charreada-a", competitionId: "equipos_completo",
        participantScope: "team", teamId: "team-a", teamName: "Equipo A", suerteId: "cala", total: 21,
        attempt: { total: 21 }, published: true, publishedAt: "2026-09-10T00:00:00.000Z"
      }
    }
  };
}

function projectionOptions() {
  return { tournamentId, nowMs: Date.parse("2026-09-10T00:00:00.000Z") };
}
