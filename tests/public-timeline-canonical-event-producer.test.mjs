import assert from "node:assert/strict";
import test from "node:test";
import officialScoreConcurrency from "../functions/officialScoreConcurrency.js?v=20260910-public-portal-default-modules-and-tournament-creation-001-v1";
import timelineProducer from "../functions/canonicalPublicTimelineEvent.js?v=20260910-public-portal-default-modules-and-tournament-creation-001-v1";
import { buildCanonicalPublicProjectionV3 as buildBrowserProjection } from "../js/public/canonicalPublicProjectionV3.js?v=20260910-public-portal-default-modules-and-tournament-creation-001-v1";
import { buildCanonicalPublicProjectionV3 as buildFunctionProjection } from "../functions/reconciliationShared/public/canonicalPublicProjectionV3.js?v=20260910-public-portal-default-modules-and-tournament-creation-001-v1";
import { createPortalV2Model } from "../js/portalV2/portalV2Model.js?v=20260910-public-portal-default-modules-and-tournament-creation-001-v1";
import { fixture as historicalFixture, withLegacyStateAsymmetry } from "./fixtures/historicalReconciliationFixture.mjs?v=20260910-recovery-skip-redundant-pending-reset-001-v1";

const { applyOfficialScoreTransaction, buildOfficialScoreFanoutUpdates, prepareOfficialScoreRequest } = officialScoreConcurrency;
const { buildCanonicalPublicTimelineEvent } = timelineProducer;
const tournamentId = "timeline-canonical-event-producer";
const charreadaId = "charreada-timeline";
const teamId = "team-timeline";
const actor = { uid: "judge-public-timeline", name: "Juez Público", email: "judge@example.test", role: "juez" };

test("accepted official publication materializes one public narrative event while rejects and retries do not", () => {
  let tournament = createTournament();
  const accepted = applyOfficialScoreTransaction(tournament, request({ suerteId: "piales", total: 21, expectedRevision: 0, idempotencyKey: "timeline:accepted-piales-0001", nowMs: 1768006800000 }));
  assert.equal(accepted.outcome.ok, true);
  tournament = deliverTimelineEvent(accepted.tournament, accepted.outcome.recordId);

  const event = Object.values(tournament.publicTimeline)[0];
  assert.equal(event.type, "SCORE");
  assert.equal(event.score, 21);
  assert.equal(event.eventId, `timeline_${accepted.outcome.recordId}`);
  assert.equal(event.occurredAt, "2026-01-10T01:00:00.000Z");
  assert.equal(event.teamName, "Rancho Público");
  assert.equal(event.participantName, "Juan Pérez");
  assert.equal(event.suerteName, "Piales");
  assert.equal(event.phaseId, "fase-unica");
  assert.equal(event.competitionId, "equipos_completo");
  assert.equal(event.charreadaId, charreadaId);
  assert.match(event.label, /Piales/);
  assert.match(event.label, /Rancho Público/);
  assert.equal(JSON.stringify(event).match(/authUid|email|idempotency|attempt|ledger|ruleId|fieldId|device/gi), null);

  const retry = applyOfficialScoreTransaction(tournament, request({ suerteId: "piales", total: 21, expectedRevision: 0, idempotencyKey: "timeline:accepted-piales-0001", nowMs: 1768006800000 }));
  assert.equal(retry.outcome.ok, true);
  assert.equal(retry.outcome.idempotent, true);
  tournament = deliverTimelineEvent(retry.tournament, retry.outcome.recordId);
  assert.equal(Object.keys(tournament.publicTimeline).length, 1, "same official record overwrites the same public event only");

  const rejected = applyOfficialScoreTransaction(tournament, request({ suerteId: "piales", total: 22, expectedRevision: 0, idempotencyKey: "timeline:rejected-piales-0001", nowMs: 1768006860000 }));
  assert.equal(rejected.outcome.ok, false);
  assert.equal(Object.keys(rejected.tournament.publicTimeline).length, 1, "rejected official publication cannot create a public event");
});

test("zero and negative official values remain narrative values, never absence or clamped values", () => {
  let tournament = createTournament();
  for (const [suerteId, total, key, nowMs] of [
    ["cala", 0, "timeline:zero-cala-0001", 1768006920000],
    ["toro", -2, "timeline:negative-toro-0001", 1768006980000]
  ]) {
    const applied = applyOfficialScoreTransaction(tournament, request({ suerteId, total, expectedRevision: 0, idempotencyKey: key, nowMs }));
    assert.equal(applied.outcome.ok, true);
    tournament = deliverTimelineEvent(applied.tournament, applied.outcome.recordId);
  }
  const events = Object.values(tournament.publicTimeline);
  assert.deepEqual(events.map((event) => event.score).sort((left, right) => left - right), [-2, 0]);
});

test("correction 15 to 21 remains narrative while canonical result, public V3, and Portal retain 21 / 193", () => {
  const root = historicalFixture(1);
  const tournament = root.tournaments["test-reconciliation-fixture"];
  const initial = Object.values(tournament.publishedScores).find((record) => record.suerte?.id === "pial_ruedo");
  const [legacyLedgerKey, ledger] = Object.entries(tournament.officialScoreLedger).find(([, entry]) => entry.activeRecordId === initial.id);
  initial.total = 15;
  initial.breakdown.total = 15;
  initial.breakdown.attemptV2.scoring.goodPoints = 15;
  initial.breakdown.attemptV2.scoring.teamAdjustedPoints = 15;
  ledger.records[initial.id] = structuredClone(initial);

  const correctionRequest = prepareOfficialScoreRequest({
    tournamentId: "test-reconciliation-fixture",
    scoreId: "charreada-fixture__casa-1__pial_ruedo",
    idempotencyKey: "timeline:certified-correction-0001",
    expectedRevision: 1,
    scorePayload: [{ base: 21, total: 21 }],
    publishedScore: {
      attemptKey: initial.attemptKey,
      tournament: { id: "test-reconciliation-fixture", name: "Test fixture" },
      charreada: { id: "charreada-fixture", name: "Charreada", competitionId: "equipos_completo", phaseId: "fase-unica", phaseName: "Ronda única" },
      competition: { id: "equipos_completo", name: "Equipos", scope: "team" },
      team: { id: "casa-1", name: "Casa 1" },
      participant: { id: "charro-2", name: "Pedro Pérez" },
      suerte: { id: "pial_ruedo", name: "Pial de ruedo" },
      attemptIndex: 3,
      coleadorIndex: 0,
      attempt: { total: 21 },
      breakdown: { total: 21 },
      total: 21
    }
  }, actor, { nowMs: Date.parse("2026-09-09T20:10:00.000Z") });
  assert.equal(correctionRequest.valid, true, correctionRequest.errors?.join(","));
  // The historical fixture predates Attempt V2's canonical ledger key. The
  // producer still consumes only the new accepted record; this normalization
  // makes the fixture's correction follow the current authority contract.
  delete tournament.officialScoreLedger[legacyLedgerKey];
  ledger.attemptId = correctionRequest.request.attemptId;
  tournament.officialScoreLedger[ledger.attemptId] = ledger;
  const corrected = applyOfficialScoreTransaction(tournament, correctionRequest.request);
  assert.equal(corrected.outcome.ok, true);
  const delivered = deliverTimelineEvent(corrected.tournament, corrected.outcome.recordId);
  const correction = Object.values(delivered.publicTimeline)[0];
  assert.equal(correction.type, "CORRECTION");
  assert.equal(correction.previousScore, 15);
  assert.equal(correction.score, 21);

  const browser = buildBrowserProjection({ tournament: delivered }, { tournamentId: "test-reconciliation-fixture", nowMs: Date.parse("2026-09-09T20:11:00.000Z") });
  const functions = buildFunctionProjection({ tournament: delivered }, { tournamentId: "test-reconciliation-fixture", nowMs: Date.parse("2026-09-09T20:11:00.000Z") });
  assert.deepEqual(functions.timeline, browser.timeline, "Function and Browser transport the identical public timeline allowlist");
  const result = browser.results.teams.find((row) => row.teamId === "casa-1");
  assert.equal(result.columns.pial_ruedo, 21);
  assert.equal(result.total, 193);
  assert.equal(Object.values(result.columns).includes(63), false);
  const portal = createPortalV2Model(browser, { availability: "ready", view: "en-vivo" });
  assert.deepEqual(portal.liveTimeline.timeline[0].correction, { previousScore: 15, score: 21 });
  assert.equal(portal.publicData.results.find((row) => row.resultId === result.resultId).total, 193);

  const correctionRetry = applyOfficialScoreTransaction(delivered, correctionRequest.request);
  assert.equal(correctionRetry.outcome.idempotent, true);
  assert.equal(Object.keys(correctionRetry.tournament.publicTimeline).length, 1);
});

test("V3 transports only stored public events and never reconstructs duplicate legacy heads", () => {
  const root = withLegacyStateAsymmetry();
  const tournament = root.tournaments["test-reconciliation-fixture"];
  const projection = buildBrowserProjection({ tournament }, { tournamentId: "test-reconciliation-fixture", nowMs: Date.parse("2026-09-09T20:12:00.000Z") });
  const result = projection.results.teams.find((row) => row.teamId === "casa-1");
  assert.equal(projection.timeline.items.length, 0, "legacy published records do not become a retrospective timeline backfill");
  assert.equal(result.columns.pial_ruedo, 21);
  assert.equal(result.total, 193);

  const privateRecord = {
    id: "official_private_0001",
    total: 26,
    publishedAt: "2026-09-09T20:13:00.000Z",
    timestampMs: Date.parse("2026-09-09T20:13:00.000Z"),
    correction: false,
    team: { id: "team-private", name: "Equipo Público" },
    charreada: { id: "charreada-private", name: "Charreada Pública" },
    suerte: { id: "lazo", name: "Lazo cabecero" },
    actor: { uid: "private-uid", email: "private@example.test" },
    idempotencyKey: "private-idempotency-key"
  };
  const event = buildCanonicalPublicTimelineEvent(privateRecord);
  assert.ok(event);
  assert.equal(JSON.stringify(event).includes("private-uid"), false);
  assert.equal(JSON.stringify(event).includes("private@example.test"), false);
  assert.equal(JSON.stringify(event).includes("private-idempotency-key"), false);
});

function createTournament() {
  return {
    info: { id: tournamentId, name: "Torneo Público", status: "en_vivo" },
    meta: { activeCharreadaId: charreadaId },
    charreadas: {
      [charreadaId]: { id: charreadaId, name: "Charreada Pública", competitionId: "equipos_completo", phaseId: "fase-unica", phaseName: "Ronda única", teamIds: [teamId] }
    },
    teams: { [teamId]: { id: teamId, name: "Rancho Público" } },
    scores: {},
    publishedScores: {}
  };
}

function request({ suerteId, total, expectedRevision, idempotencyKey, nowMs }) {
  const prepared = prepareOfficialScoreRequest({
    tournamentId,
    scoreId: `${charreadaId}__${teamId}__${suerteId}`,
    idempotencyKey,
    expectedRevision,
    scorePayload: [{ total }],
    publishedScore: {
      attemptKey: `${tournamentId}__${charreadaId}__${teamId}__${suerteId}__0__0`,
      tournament: { id: tournamentId, name: "Torneo Público" },
      charreada: { id: charreadaId, name: "Charreada Pública", competitionId: "equipos_completo", phaseId: "fase-unica", phaseName: "Ronda única" },
      competition: { id: "equipos_completo", name: "Equipos", scope: "team" },
      team: { id: teamId, name: "Rancho Público" },
      participant: { id: "participant-timeline", name: "Juan Pérez" },
      suerte: { id: suerteId, name: suerteId === "piales" ? "Piales" : suerteId === "cala" ? "Cala de caballo" : "Jineteo de toro" },
      attemptIndex: 0,
      coleadorIndex: 0,
      attempt: { total },
      breakdown: { total },
      total
    }
  }, actor, { nowMs });
  assert.equal(prepared.valid, true, prepared.errors?.join(","));
  return prepared.request;
}

function deliverTimelineEvent(tournament, recordId) {
  const job = tournament.officialScoreFanout?.[recordId];
  const updates = buildOfficialScoreFanoutUpdates(tournament.info.id, job);
  const timelineEntry = Object.entries(updates || {}).find(([path]) => path.includes("/publicTimeline/"));
  assert.ok(timelineEntry, "new official fanout contains its canonical public event");
  const [, event] = timelineEntry;
  const next = structuredClone(tournament);
  next.publicTimeline ||= {};
  next.publicTimeline[event.eventId] = event;
  return next;
}

console.log("public-timeline-canonical-event-producer.test.mjs: ok");
