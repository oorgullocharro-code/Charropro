import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  buildPortalV2PublicPath,
  buildPortalV2PublicUrl,
  buildPortalV2Url
} from "../js/portalV2/portalV2Router.js?v=20260910-individual-v3-scope-horse-rules-parity-fix-001-v1";
import { buildLegacyPortalV2RedirectPath } from "../js/portalV2/legacyPortalRedirect.js?v=20260910-individual-v3-scope-horse-rules-parity-fix-001-v1";

const tournamentA = "torneo_mtvjrydx_26jzkk";
const tournamentB = "torneo_mtvjrydx_otro";
const productionBase = "https://orgullocharro.com/charropro/torneo.html?tournamentId=interno&view=dashboard&v=build-interno";

test("public access uses one V2 helper and copies only the canonical tournament URL", () => {
  assert.equal(buildPortalV2PublicPath(tournamentA), `./portal-v2.html?tournamentId=${tournamentA}`);
  assert.equal(
    buildPortalV2PublicUrl(tournamentA, productionBase),
    `https://orgullocharro.com/charropro/portal-v2.html?tournamentId=${tournamentA}`
  );
  assert.equal(buildPortalV2PublicPath(tournamentB).includes(tournamentA), false);
  assert.equal(buildPortalV2PublicPath(tournamentA).includes("v="), false);
  assert.equal(buildPortalV2PublicPath(tournamentA).includes("view="), false);
  assert.equal(buildPortalV2PublicPath(tournamentA).includes("charreada"), false);
});

test("legacy public URLs redirect once to certified Portal V2 parameters", () => {
  assert.equal(
    buildLegacyPortalV2RedirectPath(`https://orgullocharro.com/charropro/torneo-publico.html?tournamentId=${tournamentA}&view=resultados&competition=equipos&phase=final&v=legacy-build&charreadaId=private`),
    `/charropro/portal-v2.html?tournamentId=${tournamentA}&view=resultados&competition=equipos&phase=final`
  );
  assert.equal(
    buildLegacyPortalV2RedirectPath("https://orgullocharro.com/charropro/torneo-publico.html?evento=torneo_legacy"),
    "/charropro/portal-v2.html?tournamentId=torneo_legacy"
  );
  assert.equal(
    buildLegacyPortalV2RedirectPath("https://orgullocharro.com/charropro/torneo-publico.html?view=administrar&debug=yes"),
    "/charropro/portal-v2.html"
  );
  assert.equal(buildLegacyPortalV2RedirectPath(`https://orgullocharro.com/charropro/torneo-publico.html?tournamentId=${tournamentA}`).includes("torneo-publico.html"), false);
});

test("Portal V2 direct refresh and deep links preserve their own certified public route", () => {
  assert.equal(
    buildPortalV2Url(`/charropro/portal-v2.html?tournamentId=${tournamentA}&view=resultados&competition=equipos&phase=final`),
    `/charropro/portal-v2.html?tournamentId=${tournamentA}&view=resultados&competition=equipos&phase=final`
  );
});

test("dashboard and tournament list expose V2 public actions without legacy navigation", async () => {
  const app = await readFile(new URL("../js/app.js", import.meta.url), "utf8");
  const legacyHtml = await readFile(new URL("../torneo-publico.html", import.meta.url), "utf8");
  assert.match(app, /buildPortalV2PublicPath/);
  assert.match(app, /data-action="copy-public-tournament-url"/);
  assert.match(app, />Pagina publica</);
  assert.match(app, /roleCan\(firebaseAccess\.role, "manage"\) \? "Administrar"/);
  assert.equal(app.includes("torneo-publico.html"), false);
  assert.match(legacyHtml, /data-charropro-compatibility="portal-v2-redirect"/);
});

console.log("portal-v2-public-access-legacy-retirement.test.mjs: ok");
