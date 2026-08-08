import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = read("torneo-publico.html");
const entry = read("js/views/torneo-publico.js");
const app = read("js/publicPortal/portalApp.js");
const router = read("js/publicPortal/portalRouter.js");
const selectors = read("js/publicPortal/portalSelectors.js");
const render = read("js/publicPortal/portalRender.js");
const css = read("css/public-portal.css");

assert.match(html, /id="public-portal-root"/);
assert.match(html, /public-portal\.css\?v=20260728-public-portal-design-system-v2-001-sports-ui-v2/);
assert.match(html, /torneo-publico\.js\?v=20260808-scorer-responsive-component-system-001-v1/);
assert.match(entry, /bootstrapPublicPortal/);
assert.ok(entry.split("\n").length <= 5, "legacy view entrypoint remains thin");

assert.equal(count(app, "subscribePublicTournamentSnapshot("), 1, "one public projection subscription");
assert.equal(count(app, "addEventListener(\"popstate\""), 1, "one History API listener");
assert.match(app, /applyPublicPortalSnapshot/);
assert.match(app, /applyPublicPortalConnection/);
assert.match(app, /evaluatePublicPortalStale/);
assert.match(app, /changedSections/);
assert.match(app, /runtime\.projectionListenerCount = 1/);
assert.match(app, /runtime\.connectionListenerCount = 1/);

for (const view of ["inicio", "en-vivo", "programa", "competencias", "resultados", "sabana"]) {
  assert.match(router, new RegExp(`\"${view}\"`));
}
assert.match(router, /competitionId/);
assert.match(router, /charreadaId/);
assert.match(router, /programDay/);
assert.match(router, /programPhaseId/);
assert.match(router, /pushState|buildPublicPortalUrl/);
assert.match(render, /aria-live/);
assert.match(render, /aria-current/);
assert.match(render, /scope = "col"/);
assert.match(render, /scope = "row"/);
assert.match(render, /replaceChildren/);
assert.match(render, /Minuto a minuto/);
assert.match(render, /data-portal-feed-list|portalFeedList/);
assert.match(render, /public-portal-column-abbr/);
assert.match(render, /Orden de participación/);
assert.equal(render.includes("Asociación"), false);
assert.equal(render.includes("innerHTML"), false, "public data is never inserted through innerHTML");

const publicModules = [app, router, selectors, render, entry].join("\n");
for (const forbidden of [
  "live/current",
  "publishedScores",
  "broadcastStudio/sessions",
  "audit/publishedScores",
  "firebase-rules-auditoria"
]) {
  assert.equal(publicModules.includes(forbidden), false, `${forbidden} is not a portal dependency`);
}
assert.doesNotMatch(publicModules, /\bset\s*\(\s*ref\s*\(/, "portal does not write through Firebase");
assert.doesNotMatch(publicModules, /\bupdate\s*\(\s*ref\s*\(/, "portal does not call Firebase update");
assert.equal(publicModules.includes("runTransaction"), false, "portal does not transact");

assert.match(selectors, /officialTotal/);
assert.match(selectors, /officialPosition/);
assert.equal(selectors.includes(".sort((left, right) => right.officialTotal"), false);
assert.equal(selectors.includes("subtotal +"), false);
assert.match(selectors, /competitionId/);
assert.match(selectors, /participantScope/);

assert.match(css, /min-height: 44px/);
assert.match(css, /prefers-reduced-motion/);
assert.match(css, /overflow-x: auto/);
assert.match(css, /position: sticky/);
assert.match(css, /@media \(max-width: 520px\)/);
assert.equal(css.includes("!important"), false);
assert.equal(css.includes("linear-gradient"), false);
assert.equal(css.includes("radial-gradient"), false);

console.log("public-portal-core.test.mjs: ok");

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function count(value, token) {
  return value.split(token).length - 1;
}
