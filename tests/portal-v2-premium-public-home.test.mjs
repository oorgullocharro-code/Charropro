import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createCanonicalPublicTournamentData } from "../js/public/canonicalPublicTournamentData.js?v=20260912-portal-v2-home-visual-composition-002-v1";
import { createPortalV2Model } from "../js/portalV2/portalV2Model.js?v=20260912-portal-v2-home-visual-composition-002-v1";
import { createPortalV2Shell, renderPortalV2 } from "../js/portalV2/portalV2Render.js?v=20260912-portal-v2-home-visual-composition-002-v1";

class FakeNode {
  constructor(tagName) {
    this.tagName = tagName;
    this.children = [];
    this.dataset = {};
    this.style = { setProperty() {} };
    this.attributes = {};
    this.textContent = "";
  }

  append(...nodes) { this.children.push(...nodes); }
  prepend(...nodes) { this.children.unshift(...nodes); }
  replaceChildren(...nodes) { this.children = nodes; }
  setAttribute(name, value) { this.attributes[name] = value; }
}

function fixture(overrides = {}) {
  return createCanonicalPublicTournamentData({
    tournamentId: "portal-v2-premium-fixture",
    sourceRevision: 9,
    projectionRevision: 12,
    generatedAt: "2026-09-11T18:00:00.000Z",
    lifecycle: { status: "LIVE" },
    tournament: { id: "portal-v2-premium-fixture", name: "Charreada de diseño", venue: "Lienzo Charro", city: "Tequila" },
    branding: { coverImageUrl: "https://example.test/cover.jpg", logoUrl: "https://example.test/logo.png" },
    modules: [
      { type: "live", enabled: true, order: 10 },
      { type: "program", enabled: true, order: 20 },
      { type: "results", enabled: true, order: 30 },
      { type: "standings", enabled: true, order: 40 },
      { type: "sheet", enabled: true, order: 50 },
      { type: "sponsors", enabled: true, order: 60 }
    ],
    sponsors: [{ id: "sponsor-premium", name: "Patrocinador publicado", placement: "hero", tier: "principal", order: 1 }],
    live: { status: "LIVE", currentTeam: "Rancho Los Laureles", currentSuerte: "Cala", currentScore: 31 },
    program: { items: [{ id: "charreada-premium", charreadaId: "charreada-premium", competitionId: "equipos", name: "Charreada principal", scheduledDate: "2026-09-11", scheduledTime: "12:00", order: 1, teamNames: ["Rancho Los Laureles"] }] },
    results: { teams: [{ resultId: "result-premium", teamId: "team-premium", teamName: "Rancho Los Laureles", charreadaId: "charreada-premium", competitionId: "equipos", columns: { cala: 31 }, penalties: 0, subtotal: 31, total: 31, status: "PARTIAL" }] },
    standings: { items: [{ rankingId: "standing-premium", resultId: "result-premium", position: 1, teamId: "team-premium", teamName: "Rancho Los Laureles", charreadaId: "charreada-premium", competitionId: "equipos", total: 31, status: "PARTIAL" }] },
    sheet: { competitions: [{ competitionId: "equipos", charreadaId: "charreada-premium", rows: [{ resultId: "result-premium", teamId: "team-premium", teamName: "Rancho Los Laureles", columns: { cala: 31 }, total: 31 }] }] },
    ...overrides
  });
}

function render(model) {
  const originalDocument = globalThis.document;
  globalThis.document = { createElement: (tagName) => new FakeNode(tagName) };
  try {
    const root = new FakeNode("div");
    const shell = createPortalV2Shell(root);
    renderPortalV2(shell, model);
    return root;
  } finally {
    globalThis.document = originalDocument;
  }
}

function collect(root, predicate, values = []) {
  if (predicate(root)) values.push(root);
  for (const child of root.children || []) collect(child, predicate, values);
  return values;
}

test("premium Portal V2 keeps all six official routes in its compact public header and mobile menu", () => {
  const model = createPortalV2Model(fixture(), { availability: "ready", view: "inicio", connection: "online" });
  const root = render(model);
  const routeButtons = collect(root, (node) => node.dataset?.portalV2View);
  assert.deepEqual([...new Set(routeButtons.map((node) => node.dataset.portalV2View))].sort(), ["en-vivo", "inicio", "posiciones", "programa", "resultados", "sabana"]);
  assert.equal(collect(root, (node) => node.textContent === "☰").length, 1);
});

test("premium hero CTA follows only the canonical lifecycle and published modules", () => {
  const cases = [
    ["PRE_EVENT", "programa"],
    ["LIVE", "en-vivo"],
    ["FINALIZED", "resultados"]
  ];
  for (const [status, target] of cases) {
    const model = createPortalV2Model(fixture({ lifecycle: { status } }), { availability: "ready", view: "inicio", connection: "online" });
    const root = render(model);
    assert.ok(collect(root, (node) => node.dataset?.portalV2View === target && node.className === "portal-v2-hero__action").length === 1);
  }
});

test("premium Home uses published data, keeps missing content neutral, and shows sponsors only from the public source", () => {
  const published = render(createPortalV2Model(fixture(), { availability: "ready", view: "inicio", connection: "online" }));
  assert.equal(collect(published, (node) => node.textContent === "Rancho Los Laureles").length > 0, true);
  assert.equal(collect(published, (node) => node.textContent === "Patrocinador publicado").length, 1);
  assert.equal(collect(published, (node) => node.className === "portal-v2-hero__image").length, 1);

  const withoutSponsor = fixture({ modules: fixture().modules.filter((module) => module.type !== "sponsors"), sponsors: [] });
  const neutral = render(createPortalV2Model(withoutSponsor, { availability: "ready", view: "inicio", connection: "online" }));
  assert.equal(collect(neutral, (node) => node.textContent === "Patrocinador publicado").length, 0);
  assert.equal(collect(neutral, (node) => node.textContent === "Los resultados oficiales aparecerán cuando sean publicados.").length, 0);
});

test("premium Home keeps individual participant and horse identity without applying team semantics", () => {
  const snapshot = createCanonicalPublicTournamentData({
    tournamentId: "portal-v2-premium-individual",
    sourceRevision: 10,
    projectionRevision: 13,
    generatedAt: "2026-09-11T18:00:00.000Z",
    lifecycle: { status: "LIVE" },
    tournament: { id: "portal-v2-premium-individual", name: "Coleadero Individual" },
    modules: ["live", "program", "results", "standings", "sheet"].map((type, order) => ({ type, enabled: true, order })),
    live: { status: "LIVE", participantScope: "individual", currentParticipant: "Gustavo Mares", currentHorseId: "horse-moro", currentHorseName: "Moro", currentSuerte: "Colas", currentScore: 27 },
    program: { items: [{ id: "lote-uno", charreadaId: "lote-uno", competitionId: "coleadero", name: "Lote uno", scheduledDate: "2026-09-11", scheduledTime: "12:00", order: 1, participantScope: "individual", participantIds: ["participant-gustavo"], participantNames: ["Gustavo Mares"], horseIds: ["horse-moro"], horseNames: ["Moro"] }] },
    results: { teams: [{ resultId: "result-gustavo", participantScope: "individual", participantId: "participant-gustavo", participantName: "Gustavo Mares", horseId: "horse-moro", horseName: "Moro", charreadaId: "lote-uno", competitionId: "coleadero", columns: { colas: 27 }, penalties: 0, subtotal: 27, total: 27, status: "OFFICIAL" }] },
    standings: { items: [{ rankingId: "standing-gustavo", resultId: "result-gustavo", resultIds: ["result-gustavo"], position: 1, scopeType: "competition", charreadaId: "lote-uno", competitionId: "coleadero", participantScope: "individual", participantId: "participant-gustavo", participantName: "Gustavo Mares", horseId: "horse-moro", horseName: "Moro", total: 27, classification: "official", status: "OFFICIAL" }] },
    sheet: { competitions: [{ competitionId: "coleadero", charreadaId: "lote-uno", rows: [{ resultId: "result-gustavo", participantId: "participant-gustavo", participantName: "Gustavo Mares", horseId: "horse-moro", horseName: "Moro", columns: { colas: 27 }, total: 27 }] }] }
  });
  const root = render(createPortalV2Model(snapshot, { availability: "ready", view: "inicio", connection: "online" }));
  assert.equal(collect(root, (node) => node.textContent.includes("Gustavo Mares")).length > 0, true);
  assert.equal(collect(root, (node) => node.textContent.includes("Moro")).length > 0, true);
  assert.equal(collect(root, (node) => node.textContent === "Equipo").length, 0);
});

test("premium Portal V2 stylesheet provides a full-bleed hero and transparent responsive sponsor band", async () => {
  const css = await readFile(new URL("../css/portal-v2.css", import.meta.url), "utf8");
  for (const token of ["--portal-bg", "--portal-surface", "--portal-blue", "--portal-silver", "--portal-live"]) assert.match(css, new RegExp(token));
  assert.match(css, /\.portal-v2-body\s*\{[^}]*overflow-x:\s*hidden;/s);
  assert.match(css, /@media \(max-width: 780px\)/);
  assert.match(css, /\.portal-v2-hero::before[\s\S]*linear-gradient\(90deg/);
  assert.match(css, /\.portal-v2-title\s*\{[\s\S]*font-size:\s*clamp\(/);
  assert.match(css, /\.portal-v2-sponsors__list\s*\{[\s\S]*overflow-x:\s*auto;/);
  assert.match(css, /@media \(max-width: 780px\)\s*\{[\s\S]*\.portal-v2-header__content\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*minmax\(0, 1fr\) auto;/);
  assert.match(css, /\.portal-v2-home__action\s*\{[^}]*justify-self:\s*start;/);
  const sponsorImageRules = [...css.matchAll(/\.portal-v2-sponsor img\s*\{([^}]*)\}/g)];
  assert.equal(sponsorImageRules.some((match) => /background:\s*transparent;/.test(match[1])), true);
  assert.doesNotMatch(css, /text-overflow:\s*ellipsis/);
});

console.log("portal-v2-premium-public-home.test.mjs: ok");
