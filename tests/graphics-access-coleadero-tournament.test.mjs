import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const appSource = await readFile(new URL("../js/app.js", import.meta.url), "utf8");

test("Coleadero graphics keeps separate traditional and individual tournament entrypoints", () => {
  const screensSource = sourceBetween(appSource, "function getLiveScreens()", "function renderLiveScreenGroup(");
  const existing = screensSource.indexOf('label: "Coleadero"');
  const tournament = screensSource.indexOf('label: "Coleadero torneo"');
  const tournamentEntry = screensSource.slice(screensSource.lastIndexOf("{", tournament), screensSource.indexOf("},", tournament) + 2);

  assert.ok(existing >= 0, "the existing Coleadero access remains available");
  assert.ok(tournament > existing, "the individual tournament access is added alongside the existing one");
  assert.match(screensSource.slice(existing, tournament), /fileName: "grafico-coleadero\.html"/);
  assert.match(tournamentEntry, /id: "coleadero-torneo"/);
  assert.match(tournamentEntry, /fileName: "grafico-coleadero-torneo\.html"/);
  assert.equal(
    (screensSource.match(/getGraphicHref\("grafico-coleadero\.html"\)/g) || []).length,
    1,
    "the traditional entrypoint remains singular"
  );
  assert.match(tournamentEntry, /getGraphicHref\("grafico-coleadero-torneo\.html"\)/);
});

test("duplicate Browser Source entrypoints receive unique copy-card IDs", () => {
  const cardSource = sourceBetween(appSource, "function renderLiveScreenUrl(", "function renderScoring(");
  assert.match(cardSource, /screen\.id \|\| screen\.fileName/);
  assert.match(cardSource, /data-action="copy-live-url"/);
  assert.match(cardSource, /value="\$\{escapeHTML\(screen\.absoluteHref\)\}"/);
});

test("traditional and tournament Coleadero render branches remain isolated", async () => {
  const [graphicSource, traditionalEntry, tournamentEntry, stylesheet] = await Promise.all([
    readFile(new URL("../js/views/grafico.js", import.meta.url), "utf8"),
    readFile(new URL("../grafico-coleadero.html", import.meta.url), "utf8"),
    readFile(new URL("../grafico-coleadero-torneo.html", import.meta.url), "utf8"),
    readFile(new URL("../css/styles.css", import.meta.url), "utf8")
  ]);

  assert.match(traditionalEntry, /data-view="coleadero"/);
  assert.match(tournamentEntry, /data-view="coleadero-torneo"/);
  assert.match(graphicSource, /if \(view === "coleadero"\) \{\s+root\.innerHTML = renderTraditionalColeaderoGraphic\(payload, config\);/);
  assert.match(graphicSource, /if \(view === "coleadero-torneo"\) \{\s+root\.innerHTML = renderTournamentColeaderoGraphic\(payload, config\);/);
  assert.match(graphicSource, /data\.participantScope !== "individual"\) return renderTournamentColeaderoUnavailableGraphic\(\)/);
  assert.match(graphicSource, /graphic-coleadero-tournament/);
  assert.match(stylesheet, /\.graphic-coleadero-tournament\s*\{\s*width: min\(590px, calc\(100vw - 24px\)\);/);
  assert.match(stylesheet, /\.graphic-coleadero-individual\s*\{\s*width: min\(1040px, calc\(100vw - 24px\)\);/);
});

function sourceBetween(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.ok(start >= 0 && end > start, `source range must exist: ${startMarker}`);
  return source.slice(start, end);
}
