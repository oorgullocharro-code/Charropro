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
} from "../js/data/fmch2026TernaRules.js?v=20260831-firebase-functions-node22-runtime-migration-001-v1";

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
  participantSlot: 1,
  participantName: "Charro 1",
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
assert.equal(session.history[0].participantId, "cabecero-a");
assert.equal(session.history[0].participantSlot, 1);
assert.equal(session.history[0].participantName, "Charro 1");

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

let repeatedParticipantSession = createFmch2026TernaSession({ ...identity, teamId: "equipo-identidad-repetida" });
repeatedParticipantSession = consume(repeatedParticipantSession, "HEAD", 1, false, {
  participantId: "charro-1",
  participantSlot: 1,
  participantName: "Charro 1"
});
repeatedParticipantSession = consume(repeatedParticipantSession, "HEAD", 2, false, {
  participantId: "charro-1",
  participantSlot: 1,
  participantName: "Charro 1"
});
assert.deepEqual(
  repeatedParticipantSession.history.map(({ participantId, participantSlot }) => ({ participantId, participantSlot })),
  [
    { participantId: "charro-1", participantSlot: 1 },
    { participantId: "charro-1", participantSlot: 1 }
  ],
  "multiple attempts from one charro remain owned by the same roster slot"
);
assert.deepEqual(
  normalizeFmch2026TernaSession(structuredClone(repeatedParticipantSession), repeatedParticipantSession).history,
  repeatedParticipantSession.history,
  "refresh/reconnect preserves participant identity on every consumed opportunity"
);

let transitionIdentitySession = createFmch2026TernaSession({ ...identity, teamId: "equipo-identidad-transicion" });
transitionIdentitySession = consume(transitionIdentitySession, "HEAD", 1, true, {
  participantId: "charro-2",
  participantSlot: 2,
  participantName: "Charro 2"
});
const pialTransitionDraft = buildFmch2026TernaOpportunityDraft(transitionIdentitySession, {
  type: "PIAL",
  participantId: "charro-2",
  participantSlot: 2,
  participantName: "Charro 2",
  result: "ZERO",
  countsForTerna: false
});
assert.equal(pialTransitionDraft.ok, true);
assert.equal(pialTransitionDraft.opportunity.participantId, "charro-2");
assert.equal(pialTransitionDraft.opportunity.participantSlot, 2, "Cabecero to Pial preserves the selected participant slot");

const appSource = readFileSync(new URL("../js/app.js", import.meta.url), "utf8");
assert.match(appSource, /resolveFmch2026TernaNextSuerteId\(session\)/);
assert.match(appSource, /setTernaScoringPointer\(nextSuerteId, session\)/);
assert.match(appSource, /select-terna-participant/);
assert.match(appSource, /buildCanonicalTernaRoster\(id, ternaNames, existing\?\.roster\?\.terna\)/);
assert.match(appSource, /function compactPublishedTeam\(team\)[\s\S]*?roster:\s*\{[\s\S]*?terna: getCanonicalTernaRoster\(team\)/);
assert.match(appSource, /participantSlot: participant\.participantSlot/);
assert.match(appSource, /terna-participant-identity-missing/);
assert.match(appSource, /hasPendingTernaSessionReview\(context\)/);
assert.match(appSource, /executeScorerTimerAuthority\(runtime, \{[\s\S]*?type: "FINISH"/);
assert.match(appSource, /advanceAfterCompletedTernaSession\(\)/);
assert.match(appSource, /session\?\.status === "COMPLETED"/);
assert.match(appSource, /return "Finalizar Terna"/);
assert.match(appSource, /"finish-terna-session": "score"/);
assert.doesNotMatch(appSource, /Attempt V3/);

console.log("terna-operational-flow.test.mjs: ok");

function consume(source, type, sequence, countsForTerna, participant = {}) {
  const participantSlot = participant.participantSlot || ((sequence - 1) % 3) + 1;
  const draft = buildFmch2026TernaOpportunityDraft(source, {
    type,
    participantId: participant.participantId || `${type.toLowerCase()}-${sequence}`,
    participantSlot,
    participantName: participant.participantName || `Charro ${participantSlot}`,
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
