import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const render = read("js/publicPortal/portalRender.js");
const app = read("js/publicPortal/portalApp.js");
const css = read("css/public-portal.css");
const html = read("torneo-publico.html");
const rules = JSON.parse(read("firebase-rules-auditoria.json"));
const publicRules = rules.rules.charropro.publicTournaments.$tournamentId;

assert.match(render, /Ahora/);
assert.match(render, /Minuto a minuto/);
assert.match(render, /actualizaciones nuevas/);
assert.match(render, /aria-labelledby/);
assert.match(render, /element\("ol", "public-portal-feed-list"\)/);
assert.equal(render.includes("innerHTML"), false);
for (const abbreviation of ["CC", "P", "C", "JT", "LC", "PR", "JY", "MP", "MC", "PM", "TOTAL"]) {
  assert.match(render + read("js/publicPortal/portalSelectors.js"), new RegExp(`\"${abbreviation}\"`));
}
assert.equal((app.match(/subscribePublicTournamentSnapshot\(/g) || []).length, 1);
assert.match(css, /prefers-reduced-motion/);
assert.match(css, /public-portal-feed-filters/);
assert.match(css, /min-height: 44px/);
assert.match(html, /public-portal-ux-001-live-feed-v1/);
assert.match(publicRules[".validate"], /liveFeed/);
assert.equal(publicRules[".read"], true);
assert.equal(publicRules.liveFeed.items.$eventId[".validate"].includes("score_published"), true);
assert.equal(publicRules.liveFeed.items.$eventId.$other[".validate"].includes("operator"), false);

console.log("public-portal-ux.test.mjs: ok");

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}
