import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const appSource = await readFile(new URL("../js/app.js", import.meta.url), "utf8");

test("Coleadero graphics keeps the traditional and individual tournament access entries", () => {
  const screensSource = sourceBetween(appSource, "function getLiveScreens()", "function renderLiveScreenGroup(");
  const existing = screensSource.indexOf('label: "Coleadero"');
  const tournament = screensSource.indexOf('label: "Coleadero torneo"');
  const tournamentEntry = screensSource.slice(screensSource.lastIndexOf("{", tournament), screensSource.indexOf("},", tournament) + 2);

  assert.ok(existing >= 0, "the existing Coleadero access remains available");
  assert.ok(tournament > existing, "the individual tournament access is added alongside the existing one");
  assert.match(screensSource.slice(existing, tournament), /fileName: "grafico-coleadero\.html"/);
  assert.match(tournamentEntry, /id: "coleadero-torneo"/);
  assert.match(tournamentEntry, /fileName: "grafico-coleadero\.html"/);
  assert.equal(
    (screensSource.match(/getGraphicHref\("grafico-coleadero\.html"\)/g) || []).length,
    2,
    "both labels reuse the one canonical Browser Source URL builder"
  );
});

test("duplicate Browser Source entrypoints receive unique copy-card IDs", () => {
  const cardSource = sourceBetween(appSource, "function renderLiveScreenUrl(", "function renderScoring(");
  assert.match(cardSource, /screen\.id \|\| screen\.fileName/);
  assert.match(cardSource, /data-action="copy-live-url"/);
  assert.match(cardSource, /value="\$\{escapeHTML\(screen\.absoluteHref\)\}"/);
});

function sourceBetween(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.ok(start >= 0 && end > start, `source range must exist: ${startMarker}`);
  return source.slice(start, end);
}
