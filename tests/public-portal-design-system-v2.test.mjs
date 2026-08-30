import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PUBLIC_PORTAL_UX_FIXTURE } from "./fixtures/publicPortalUxFixture.js?v=20260830-negative-timing-attempt-v2-official-publication-recovery-001-v1";

const render = read("js/publicPortal/portalRender.js");
const app = read("js/publicPortal/portalApp.js");
const selectors = read("js/publicPortal/portalSelectors.js");
const css = read("css/public-portal.css");
const html = read("torneo-publico.html");
const fixture = read("tests/fixtures/publicPortalUxFixture.js");
const responsiveFixture = read("tests/fixtures/public-portal-ux-responsive.html");

for (const token of [
  "--cp-color-background",
  "--cp-color-surface",
  "--cp-color-primary",
  "--cp-color-accent",
  "--cp-color-gold",
  "--cp-color-success",
  "--cp-color-warning",
  "--cp-color-danger",
  "--cp-color-text",
  "--cp-color-text-muted",
  "--cp-radius-card",
  "--cp-shadow-card",
  "--cp-motion-fast",
  "--cp-motion-normal",
  "--cp-layout-max"
]) {
  assert.match(css, new RegExp(token));
}

for (const component of [
  "public-portal-hero",
  "public-portal-navigation",
  "public-portal-now",
  "public-portal-competition-card",
  "public-portal-score-card",
  "public-portal-ranking-row",
  "public-portal-podium",
  "public-portal-feed-item",
  "public-portal-state",
  "public-portal-skeleton",
  "public-portal-sheet",
  "public-portal-footer"
]) {
  assert.match(render + css, new RegExp(component));
}

assert.match(render, /competencias: "Rankings"/);
assert.match(render, /createElementNS\("http:\/\/www\.w3\.org\/2000\/svg", "svg"\)/);
assert.match(render, /setAttribute\("aria-hidden", "true"\)/);
assert.match(render, /renderPodium\(model\.results\)/);
assert.match(render, /renderRankingList/);
assert.match(render, /data\.eventType|dataset\.eventType/);
assert.match(render, /Desliza horizontalmente/);
assert.match(css, /\.public-portal-sheet thead th[\s\S]*?position: sticky/);
assert.match(css, /@media \(max-width: 520px\)/);
assert.match(css, /min-height: 44px/);
assert.match(css, /prefers-reduced-motion/);

assert.equal((app.match(/subscribePublicTournamentSnapshot\(/g) || []).length, 1);
assert.equal(app.includes("setInterval(checkStale, 15000)"), true);
assert.equal(render.includes("innerHTML"), false);
assert.equal(render.includes("Asociación"), false);
assert.equal(fixture.includes("Asociacion"), false);
assert.equal(css.includes("!important"), false);
assert.equal(css.includes("linear-gradient"), false);
assert.equal(css.includes("radial-gradient"), false);
assert.match(html, /data-charropro-build-href="\.\/css\/public-portal\.css"/);
for (const viewport of [320, 360, 390, 768, 1024, 1280, 1440, 1920]) {
  assert.match(responsiveFixture, new RegExp(`width: ${viewport}px`));
}

const publicSources = [render, app, selectors].join("\n");
for (const forbidden of [
  "live/current",
  "publishedScores",
  "audit/publishedScores",
  "broadcastStudio/sessions",
  "firebase-rules-auditoria"
]) {
  assert.equal(publicSources.includes(forbidden), false);
}

const results = PUBLIC_PORTAL_UX_FIXTURE.results.items;
assert.equal(results.length, 12);
assert.equal(results[0].scores.PM, 24);
assert.equal(results[0].teamPenaltyTotal, -4);
assert.equal(results[3].scores.CC, 0);
assert.equal(Object.hasOwn(results[11].scores, "PM"), false);
assert.equal(results[11].officialTotal, null);
assert.ok(PUBLIC_PORTAL_UX_FIXTURE.liveFeed.items.evt8);
assert.equal(PUBLIC_PORTAL_UX_FIXTURE.liveFeed.items.evt8.eventType, "score_corrected");
assert.equal(PUBLIC_PORTAL_UX_FIXTURE.liveFeed.items.evt7.eventType, "penalty_published");

for (const abbreviation of ["CC", "P", "C", "JT", "LC", "PR", "JY", "MP", "MC", "PM", "PEN", "TOTAL", "POS"]) {
  assert.match(render + selectors, new RegExp(`"${abbreviation}"`));
}

console.log("public-portal-design-system-v2.test.mjs: ok");

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}
