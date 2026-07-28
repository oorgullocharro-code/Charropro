import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const render = read("js/publicPortal/portalRender.js");
const app = read("js/publicPortal/portalApp.js");
const router = read("js/publicPortal/portalRouter.js");
const selectors = read("js/publicPortal/portalSelectors.js");
const css = read("css/public-portal.css");
const html = read("torneo-publico.html");
const fixture = read("tests/fixtures/publicPortalUxFixture.js");
const responsiveFixture = read("tests/fixtures/public-portal-ux-responsive.html");
const rules = JSON.parse(read("firebase-rules-auditoria.json"));
const publicRules = rules.rules.charropro.publicTournaments.$tournamentId;

assert.match(render, /Ahora/);
assert.match(render, /Minuto a minuto/);
assert.match(render, /actualizaciones nuevas/);
assert.match(render, /aria-labelledby/);
assert.match(render, /element\("ol", "public-portal-feed-list"\)/);
assert.equal(render.includes("innerHTML"), false);
for (const abbreviation of ["CC", "P", "C", "JT", "LC", "PR", "JY", "MP", "MC", "PM", "PEN", "TOTAL", "POS"]) {
  assert.match(render + selectors, new RegExp(`\"${abbreviation}\"`));
}
const sheetOrder = ["CC", "P", "C", "JT", "LC", "PR", "JY", "MP", "MC", "PM"];
assert.deepEqual(
  [...selectors.matchAll(/\{ id: "(CC|P|C|JT|LC|PR|JY|MP|MC|PM)"/g)].map((match) => match[1]),
  sheetOrder
);
assert.match(render, /Paso de la muerte/);
assert.match(render, /abbreviation\("PEN", "Penalizaciones"\)/);
assert.equal(render.includes("Asociación"), false);
assert.equal(fixture.includes("Asociacion"), false);
for (const token of [
  "Ahora en el programa",
  "Orden de participación",
  "Filtros del programa",
  "Ver detalle",
  "Ver resultados",
  "Ver En Vivo"
]) assert.match(render, new RegExp(token));
assert.match(router, /programDay/);
assert.match(router, /programPhaseId/);
assert.match(router, /searchParams, "day"/);
assert.match(router, /searchParams, "phase"/);
assert.equal((app.match(/subscribePublicTournamentSnapshot\(/g) || []).length, 1);
assert.match(css, /prefers-reduced-motion/);
assert.match(css, /public-portal-feed-filters/);
assert.match(css, /public-portal-program-filter-options/);
assert.match(css, /public-portal-program-participant-list/);
assert.match(css, /min-height: 44px/);
assert.match(responsiveFixture, /id="mobile-program-390"/);
assert.match(responsiveFixture, /id="mobile-program-320"/);
assert.match(publicRules[".validate"], /liveFeed/);
assert.match(publicRules.program.items.$itemId.$other[".validate"], /venueName/);
assert.match(publicRules.program.items.$itemId.$other[".validate"], /publicNotes/);
assert.equal(publicRules[".read"], true);
assert.equal(publicRules.liveFeed.items.$eventId[".validate"].includes("score_published"), true);
assert.equal(publicRules.liveFeed.items.$eventId.$other[".validate"].includes("operator"), false);

console.log("public-portal-ux.test.mjs: ok");

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}
