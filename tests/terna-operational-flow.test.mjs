import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  FMCH_2026_TERNA_CLOSED_UNUSED_STATUS,
  buildFmch2026TernaOpportunityDraft,
  canFinishFmch2026TernaSession,
  commitFmch2026TernaOpportunity,
  createFmch2026TernaSession,
  finishFmch2026TernaSession,
  normalizeFmch2026TernaSession,
  reserveFmch2026TernaOpportunity,
  resolveFmch2026TernaNextSuerteId
} from "../js/data/fmch2026TernaRules.js?v=20260827-scorer-global-timer-reactivity-recovery-001-v1";

const identity = {
  tournamentId: "demo-local-fmch-2026",
  competitionId: "equipos_completo",
  charreadaId: "demo-local-fmch-jornada-1",
  teamId: "equipo-a"
};

let session = createFmch2026TernaSession(identity, { now: "2026-08-13T12:00:00.000Z" });
assert.equal(resolveFmch2026TernaNextSuerteId(session), "lazo");
assert.equal(canFinishFmch2026TernaSession(session), false, "an empty Terna cannot be closed early");

const firstDraft = buildFmch2026TernaOpportunityDraft(session, {
  type: "HEAD",
  participantId: "cabecero-a",
  result: "VALID",
  countsForTerna: true
});
const firstReservation = reserveFmch2026TernaOpportunity(session, firstDraft.opportunity, {
  now: "2026-08-13T12:00:10.000Z"
});
assert.equal(firstReservation.ok, true);
assert.equal(canFinishFmch2026TernaSession(firstReservation.session), false, "an active publication reservation blocks early finish");
assert.equal(resolveFmch2026TernaNextSuerteId(session), "lazo", "a failed publication does not advance canonical flow");
assert.equal(session.history.length, 0, "a failed publication does not consume the source session");

const firstCommit = commitFmch2026TernaOpportunity(
  firstReservation.session,
  firstDraft.opportunity,
  { scoreId: "score-head-1", publishedScoreId: "published-head-1" },
  { now: "2026-08-13T12:00:20.000Z" }
);
session = firstCommit.session;
assert.equal(resolveFmch2026TernaNextSuerteId(session), "pial_ruedo", "official Cabecero advances to Pial");
assert.equal(session.sharedTimerId, `${session.ternaSessionId}:timer`);
assert.equal(session.history[0].sharedOpportunityId, `${session.ternaSessionId}:op:1`);

session = consume(session, "PIAL", 2, false);
assert.equal(resolveFmch2026TernaNextSuerteId(session), "pial_ruedo", "a failed Pial keeps Pial active");
session = consume(session, "PIAL", 3, true);
assert.equal(resolveFmch2026TernaNextSuerteId(session), null, "a successful Pial completes the active role sequence");
assert.equal(session.status, "COMPLETED", "both counted Terna phases complete the session before 5/5");
assert.equal(session.currentOpportunity, null, "a completed Terna does not reserve another opportunity");
assert.equal(session.history.length, 3, "completion preserves only consumed opportunities");
assert.equal(
  session.opportunities.filter((item) => item.status === FMCH_2026_TERNA_CLOSED_UNUSED_STATUS).length,
  2,
  "remaining shared opportunities close unused"
);

for (const usedCount of [1, 2, 4]) {
  let source = createFmch2026TernaSession({ ...identity, teamId: `equipo-${usedCount}` });
  for (let index = 0; index < usedCount; index += 1) {
    source = consume(source, "HEAD", index + 1, false);
  }
  const historyBefore = structuredClone(source.history);
  const closed = finishFmch2026TernaSession(source, {
    now: `2026-08-13T12:0${usedCount}:00.000Z`,
    closedBy: "judge-fixture",
    source: "test"
  });
  assert.equal(closed.ok, true, `early finish works after opportunity ${usedCount}`);
  assert.deepEqual(closed.session.history, historyBefore, "official history remains unchanged");
  assert.equal(closed.session.currentOpportunity, null);
  assert.equal(closed.session.status, "FINISHED");
  assert.equal(closed.session.closure.type, "EARLY_FINISH");
  const unused = closed.session.opportunities.filter((item) => item.status === FMCH_2026_TERNA_CLOSED_UNUSED_STATUS);
  assert.equal(unused.length, 5 - usedCount);
  assert.equal(unused.some((item) => item.result === "ZERO" || item.result === "DQ"), false);
  assert.equal(unused.some((item) => item.scoreId || item.publishedScoreId), false);
  assert.equal(resolveFmch2026TernaNextSuerteId(closed.session), null);
  assert.equal(buildFmch2026TernaOpportunityDraft(closed.session, { type: "HEAD" }).ok, false, "no sixth or post-close opportunity is created");
  const reloaded = normalizeFmch2026TernaSession(structuredClone(closed.session), closed.session);
  assert.deepEqual(reloaded, closed.session, "reload preserves explicit closed-unused opportunities");
}

const appSource = readFileSync(new URL("../js/app.js", import.meta.url), "utf8");
assert.match(appSource, /resolveFmch2026TernaNextSuerteId\(session\)/);
assert.match(appSource, /setTernaScoringPointer\(nextSuerteId, session\)/);
assert.match(appSource, /hasPendingTernaSessionReview\(context\)/);
assert.match(appSource, /executeScorerTimerAuthority\(runtime, \{[\s\S]*?type: "FINISH"/);
assert.match(appSource, /advanceAfterCompletedTernaSession\(\)/);
assert.match(appSource, /session\?\.status === "COMPLETED"/);
assert.match(appSource, /return "Finalizar Terna"/);
assert.match(appSource, /"finish-terna-session": "score"/);
assert.doesNotMatch(appSource, /Attempt V3/);

console.log("terna-operational-flow.test.mjs: ok");

function consume(source, type, sequence, countsForTerna) {
  const draft = buildFmch2026TernaOpportunityDraft(source, {
    type,
    participantId: `${type.toLowerCase()}-${sequence}`,
    result: countsForTerna ? "VALID" : "ZERO",
    countsForTerna
  });
  assert.equal(draft.ok, true);
  const reservation = reserveFmch2026TernaOpportunity(source, draft.opportunity, {
    now: `2026-08-13T11:${String(sequence).padStart(2, "0")}:00.000Z`
  });
  assert.equal(reservation.ok, true);
  const committed = commitFmch2026TernaOpportunity(
    reservation.session,
    draft.opportunity,
    { scoreId: `score-${sequence}`, publishedScoreId: `published-${sequence}` },
    { now: `2026-08-13T11:${String(sequence).padStart(2, "0")}:30.000Z` }
  );
  assert.equal(committed.ok, true);
  return committed.session;
}
