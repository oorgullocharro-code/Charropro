import assert from "node:assert/strict";
import {
  buildPublicPortalUrl,
  isPublicPortalView,
  parsePublicPortalRoute,
  sanitizePortalId,
  sanitizePortalView
} from "../js/publicPortal/portalRouter.js";

const initial = parsePublicPortalRoute(
  "https://example.test/torneo-publico.html?tournamentId=torneo_1&view=resultados&competitionId=charro-libre&charreadaId=final-1"
);
assert.deepEqual(initial, {
  tournamentId: "torneo_1",
  view: "resultados",
  competitionId: "charro-libre",
  categoryId: "",
  phaseId: "",
  charreadaId: "final-1",
  feed: "all"
});

assert.equal(parsePublicPortalRoute("/torneo-publico.html?tournamentId=torneo_1&view=desconocida").view, "inicio");
assert.equal(parsePublicPortalRoute("/torneo-publico.html?tournamentId=torneo_1&competition=caladero").competitionId, "caladero");
assert.equal(parsePublicPortalRoute("/torneo-publico.html?evento=torneo_legacy").tournamentId, "torneo_legacy");
assert.equal(sanitizePortalView("en-vivo"), "en-vivo");
assert.equal(sanitizePortalView("<script>"), "");
assert.equal(sanitizePortalId("competition:final/1"), "competition:final/1");
assert.equal(sanitizePortalId("<img src=x onerror=alert(1)>"), "");
assert.equal(sanitizePortalId("javascript:alert(1)"), "");
assert.equal(isPublicPortalView("sabana"), true);
assert.equal(isPublicPortalView("admin"), false);
assert.equal(parsePublicPortalRoute("/torneo-publico.html?view=en-vivo&feed=score").feed, "score");
assert.equal(parsePublicPortalRoute("/torneo-publico.html?view=en-vivo&feed=<script>").feed, "all");

const sharedUrl = buildPublicPortalUrl(
  "https://example.test/torneo-publico.html?tournamentId=torneo_1&view=resultados&competition=equipos",
  {
    view: "sabana",
    competitionId: "charro-libre",
    categoryId: "libre",
    phaseId: "final",
    charreadaId: "charreada-3"
  }
);
assert.equal(
  sharedUrl,
  "/torneo-publico.html?tournamentId=torneo_1&view=sabana&competitionId=charro-libre&categoryId=libre&phaseId=final&charreadaId=charreada-3"
);
assert.equal(sharedUrl.includes("competition="), false);
assert.equal(
  buildPublicPortalUrl("/torneo-publico.html?tournamentId=torneo_1&view=en-vivo", { feed: "timer" }),
  "/torneo-publico.html?tournamentId=torneo_1&view=en-vivo&feed=timer"
);

const history = [
  buildPublicPortalUrl("/torneo-publico.html?tournamentId=torneo_1", { view: "programa" }),
  buildPublicPortalUrl("/torneo-publico.html?tournamentId=torneo_1&view=programa", {
    view: "resultados",
    competitionId: "equipos"
  }),
  buildPublicPortalUrl("/torneo-publico.html?tournamentId=torneo_1&view=resultados&competitionId=equipos", {
    view: "sabana"
  })
];
assert.equal(parsePublicPortalRoute(history[0]).view, "programa");
assert.equal(parsePublicPortalRoute(history[1]).view, "resultados");
assert.equal(parsePublicPortalRoute(history[1]).competitionId, "equipos");
assert.equal(parsePublicPortalRoute(history[2]).view, "sabana");

const maliciousUrl = buildPublicPortalUrl("/torneo-publico.html?tournamentId=torneo_1", {
  view: "<iframe>",
  competitionId: "data:text/html",
  charreadaId: "constructor[prototype]"
});
const maliciousRoute = parsePublicPortalRoute(maliciousUrl);
assert.equal(maliciousRoute.view, "inicio");
assert.equal(maliciousRoute.competitionId, "");
assert.equal(maliciousRoute.charreadaId, "");

console.log("public-portal-router.test.mjs: ok");
