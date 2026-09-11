import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { getPortalV2PreviewSnapshot } from "../fixtures/portalV2PreviewFixtures.js?v=20260911-coleadero-excel-export-valid-xlsx-and-colas-sheet-001-v1";
import { createCanonicalPublicTournamentData } from "../js/public/canonicalPublicTournamentData.js?v=20260911-coleadero-excel-export-valid-xlsx-and-colas-sheet-001-v1";
import { createPortalV2Model } from "../js/portalV2/portalV2Model.js?v=20260911-coleadero-excel-export-valid-xlsx-and-colas-sheet-001-v1";
import { applyPortalV2Snapshot } from "../js/portalV2/portalV2ProjectionState.js?v=20260911-coleadero-excel-export-valid-xlsx-and-colas-sheet-001-v1";
import { createPublicPortalClientState } from "../js/public/publicPortalClient.js?v=20260911-coleadero-excel-export-valid-xlsx-and-colas-sheet-001-v1";

test("Live Center presents the supplied current action and direct scoped summaries", () => {
  const model = portalModel("live");
  assert.equal(model.liveTimeline.live.isLive, true);
  assert.equal(model.liveTimeline.live.currentTeam, "Rancho Los Laureles");
  assert.equal(model.liveTimeline.live.currentParticipant, "Juan Pérez");
  assert.equal(model.liveTimeline.live.currentSuerte, "Pial de ruedo");
  assert.equal(model.liveTimeline.live.currentScore, 21);
  assert.equal(model.liveTimeline.live.currentCharreada, "", "opaque context IDs stay out of the public presentation");
  assert.equal(model.liveTimeline.currentResults.length, 3);
  assert.equal(model.liveTimeline.currentStandings.length, 3);
});

test("timeline narrates the 15 to 21 correction while results retain current PR 21 and total 193", () => {
  const model = portalModel("live");
  const correction = model.liveTimeline.timeline.find((item) => item.eventId === "timeline-pr-correction");
  const laureles = model.publicData.results.find((item) => item.teamName === "Rancho Los Laureles");
  assert.deepEqual(correction.correction, { previousScore: 15, score: 21 });
  assert.equal(laureles.columns.find((column) => column.key === "pial_ruedo").value, 21);
  assert.equal(laureles.total, 193);
  assert.equal(laureles.columns.some((column) => column.value === 63), false);
  assert.deepEqual(model.liveTimeline.timeline.map((item) => item.sequence), [8, 7, 6, 5, 4, 3, 2, 1]);
});

test("timeline deduplicates event IDs and renders unknown types safely", () => {
  const snapshot = structuredClone(getPortalV2PreviewSnapshot("live"));
  snapshot.timeline.items.push(structuredClone(snapshot.timeline.items[0]));
  snapshot.timeline.items.push({
    eventId: "timeline-unknown", sequence: 9, occurredAt: "2026-09-09T20:09:00.000Z", type: "FUTURE_EVENT", label: "Actualización pública compatible"
  });
  const model = createPortalV2Model(createCanonicalPublicTournamentData(snapshot), { availability: "ready", view: "en-vivo" });
  const unknown = model.liveTimeline.timeline.find((item) => item.eventId === "timeline-unknown");
  assert.equal(model.liveTimeline.timeline.length, 9);
  assert.equal(unknown.typeLabel, "Actualización pública");
  assert.equal(unknown.label, "Actualización pública compatible");
});

test("PAUSED retains the narrative while FINALIZED and ARCHIVED disable live treatment", () => {
  const preEvent = portalModel("pre-event");
  assert.equal(preEvent.liveTimeline.live.hasCurrentAction, false);
  assert.equal(preEvent.liveTimeline.timelineState, "timeline-empty");
  const paused = portalModel("paused");
  assert.equal(paused.lifecycle.status, "PAUSED");
  assert.equal(paused.liveTimeline.live.isLive, false);
  assert.equal(paused.liveTimeline.timeline.length, 8);
  assert.equal(paused.liveTimeline.timelineState, "timeline-available");
  assert.equal(portalModel("finalized").liveTimeline.live.isLive, false);
  assert.equal(portalModel("archived").liveTimeline.live.isLive, false);
});

test("stale and revision guards preserve the last valid public narrative", () => {
  const current = getPortalV2PreviewSnapshot("live");
  const initial = applyPortalV2Snapshot(createPublicPortalClientState(), current, { nowMs: Date.parse(current.generatedAt) });
  assert.equal(applyPortalV2Snapshot(initial.state, current).duplicate, true);
  const older = createCanonicalPublicTournamentData({ ...current, projectionRevision: 30 });
  assert.equal(applyPortalV2Snapshot(initial.state, older).reason, "projection-revision-regression");
  const divergent = structuredClone(current);
  divergent.live.currentScore = 22;
  const sameRevisionDifferentHash = createCanonicalPublicTournamentData(divergent);
  assert.equal(applyPortalV2Snapshot(initial.state, sameRevisionDifferentHash).reason, "projection-revision-inconsistent");
  const stale = createPortalV2Model(current, { availability: "ready", view: "en-vivo", connection: "stale" });
  assert.equal(stale.liveTimeline.timelineState, "timeline-stale");
  assert.equal(stale.liveTimeline.timeline.length, 8);
});

test("live and timeline presentation stays public, textual, and non-calculating", async () => {
  const [modelSource, renderSource, fixtureSource, css] = await Promise.all([
    readFile(new URL("../js/portalV2/portalV2LiveTimelineModel.js", import.meta.url), "utf8"),
    readFile(new URL("../js/portalV2/portalV2Render.js", import.meta.url), "utf8"),
    readFile(new URL("../fixtures/portalV2PreviewFixtures.js", import.meta.url), "utf8"),
    readFile(new URL("../css/portal-v2.css", import.meta.url), "utf8")
  ]);
  const source = `${modelSource}\n${renderSource}\n${fixtureSource}`.toLowerCase();
  for (const forbidden of ["publishedscores", "officialscoreledger", "attemptv2", "idempotencykey", "innerhtml", "reduce(", "buildofficialranking", "reconcilepublicprojection"]) {
    assert.equal(source.includes(forbidden), false, `live timeline avoids ${forbidden}`);
  }
  assert.match(renderSource, /textContent/);
  assert.match(renderSource, /aria-label/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /max-width: 520px/);
});

function portalModel(name) {
  return createPortalV2Model(getPortalV2PreviewSnapshot(name), { availability: "ready", view: "en-vivo", connection: "online" });
}

console.log("portal-v2-live-timeline.test.mjs: ok");
