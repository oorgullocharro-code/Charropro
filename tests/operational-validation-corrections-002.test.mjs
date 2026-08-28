import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  createPendingScoreReview,
  openPendingScoreReview,
  reconcilePendingScoreReviewRegistries,
  updatePendingScoreReviewDraft
} from "../js/core/pendingScoreReview.js?v=20260828-fmch-terna-federation-format-row-ownership-001-v1";
import { buildGlobalColeaderoLeader } from "../js/core/scoring.js?v=20260828-fmch-terna-federation-format-row-ownership-001-v1";
import {
  FMCH_2026_LAZO_BASE_RULES,
  FMCH_2026_TERNA_OPPORTUNITY_LIMIT,
  buildFmch2026TernaOpportunityDraft,
  commitFmch2026TernaOpportunity,
  createFmch2026TernaSession,
  finishFmch2026TernaSession,
  reserveFmch2026TernaOpportunity,
  resolveFmch2026TernaAttemptCompletion,
  resolveFmch2026TernaNextSuerteId
} from "../js/data/fmch2026TernaRules.js?v=20260828-fmch-terna-federation-format-row-ownership-001-v1";
import { adaptLegacyAttemptToV2 } from "../js/core/scoringAttempt.js?v=20260828-fmch-terna-federation-format-row-ownership-001-v1";

const actorA = { uid: "judge-a", clientId: "client-a", tabSessionId: "tab-a" };
const actorB = { uid: "judge-b", clientId: "client-b", tabSessionId: "tab-b" };
const pending = createPendingScoreReview({
  tournamentId: "tournament-a",
  competitionId: "equipos_completo",
  charreadaId: "charreada-a",
  teamId: "team-a",
  suerteId: "cala",
  scoreId: "score-a"
}, { actor: actorA, now: "2026-08-13T10:00:00.000Z" });

let clientA = reconcilePendingScoreReviewRegistries({}, { [pending.pendingId]: pending }, { tournamentId: "tournament-a" });
const opened = openPendingScoreReview(clientA[pending.pendingId], {
  actor: actorA,
  expectedRevision: 1,
  now: "2026-08-13T10:01:00.000Z"
});
assert.equal(opened.ok, true, "same-client create/open passes");
clientA = { [pending.pendingId]: opened.record };
clientA = reconcilePendingScoreReviewRegistries(clientA, {}, { tournamentId: "tournament-a" });
assert.equal(clientA[pending.pendingId].revision, 2, "an earlier empty listener snapshot cannot erase a durable acknowledgement");
clientA = reconcilePendingScoreReviewRegistries(clientA, { [pending.pendingId]: pending }, { tournamentId: "tournament-a" });
assert.equal(clientA[pending.pendingId].revision, 2, "a delayed listener cannot downgrade the durable local acknowledgement");

const updated = updatePendingScoreReviewDraft(clientA[pending.pendingId], {
  actor: actorA,
  expectedRevision: 2,
  draftSnapshot: { total: 0, confirmed: false, note: "" },
  now: "2026-08-13T10:02:00.000Z"
});
assert.equal(updated.ok, true, "same-client update passes");
clientA = { [pending.pendingId]: updated.record };
const reopened = openPendingScoreReview(clientA[pending.pendingId], {
  actor: actorA,
  expectedRevision: 3,
  now: "2026-08-13T10:03:00.000Z"
});
assert.equal(reopened.ok, true, "same-client update/open passes");

const changedByB = updatePendingScoreReviewDraft(updated.record, {
  actor: actorB,
  expectedRevision: 3,
  draftSnapshot: { total: 12 },
  now: "2026-08-13T10:04:00.000Z"
});
assert.equal(changedByB.ok, true);
const staleConflict = openPendingScoreReview(changedByB.record, {
  actor: actorA,
  expectedRevision: 3,
  now: "2026-08-13T10:05:00.000Z"
});
assert.equal(staleConflict.conflict, true, "a real cross-client conflict remains blocked");
clientA = reconcilePendingScoreReviewRegistries(clientA, { [pending.pendingId]: changedByB.record }, { tournamentId: "tournament-a" });
const afterSync = openPendingScoreReview(clientA[pending.pendingId], {
  actor: actorA,
  expectedRevision: 4,
  now: "2026-08-13T10:06:00.000Z"
});
assert.equal(afterSync.ok, true, "syncing the canonical revision allows the next operation");

for (const [winnerTeam, totals] of [
  ["team-1", [40, 22, 18, 31, 28, 20, 29, 24, 19]],
  ["team-2", [25, 31, 18, 29, 44, 22, 27, 30, 20]],
  ["team-3", [25, 31, 18, 29, 34, 22, 27, 30, 45]]
]) {
  const leader = buildGlobalColeaderoLeader(buildColeaderoScores(totals), {
    tournamentId: "tournament-a",
    charreadaId: "charreada-a"
  });
  assert.equal(leader.winners.length, 1);
  assert.equal(leader.winners[0].teamId, winnerTeam);
  assert.equal(leader.entries.length, 9, "the result compares all three coleadores from all three teams");
}

const sameName = buildGlobalColeaderoLeader([
  buildColeaderoScore("team-1", 0, 0, 20, "Mismo nombre"),
  buildColeaderoScore("team-2", 0, 0, 30, "Mismo nombre")
], { charreadaId: "charreada-a" });
assert.equal(sameName.entries.length, 2, "equal display names from different identities never merge");
assert.equal(sameName.winners[0].teamId, "team-2");

const tied = buildGlobalColeaderoLeader([
  buildColeaderoScore("team-1", 0, 0, 33, "Coleador A"),
  buildColeaderoScore("team-2", 0, 0, 33, "Coleador B")
], { charreadaId: "charreada-a" });
assert.equal(tied.tied, true);
assert.equal(tied.winners.length, 2, "ties remain explicit without an invented tiebreaker");

assertTernaRoleMatrix();
assertTernaCanonicalSuccessTransitions();

const appSource = readFileSync(new URL("../js/app.js", import.meta.url), "utf8");
const styleSource = readFileSync(new URL("../css/styles.css", import.meta.url), "utf8");
assert.match(appSource, /class="cp-paso-workspace"/);
assert.match(appSource, /class="cp-paso-primary"/);
assert.match(appSource, /class="cp-paso-summary cp-paso-context"/);
assert.match(appSource, /class="cp-paso-result"/);
assert.match(appSource, /getFmch2026SportTimerRuntimes\(context\)/, "Paso keeps the existing timer authority");
assert.match(appSource, /resolveFmch2026TernaAttemptCompletion\(attemptV2\)/, "Terna consumes the canonical Attempt V2 completion state");
assert.doesNotMatch(appSource, /hasCountableBase/, "Terna no longer infers success from a numeric base total");
assert.match(styleSource, /\.cp-paso-workspace\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\) minmax\(210px, 260px\)/);
assert.match(styleSource, /@media \(max-width: 760px\)[\s\S]*?\.cp-paso-workspace\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\)/);
assert.doesNotMatch(styleSource, /\.cp-paso-workspace[^}]*overflow-x:\s*(?:auto|scroll)/);

console.log("operational-validation-corrections-002.test.mjs: ok");

function buildColeaderoScores(totals) {
  return totals.map((total, index) => buildColeaderoScore(
    `team-${Math.floor(index / 3) + 1}`,
    index % 3,
    0,
    total,
    `Coleador ${index + 1}`
  ));
}

function buildColeaderoScore(teamId, coleadorIndex, attemptIndex, total, charro) {
  return {
    id: `${teamId}-${coleadorIndex}-${attemptIndex}`,
    attemptKey: `${teamId}-${coleadorIndex}-${attemptIndex}`,
    tournament: { id: "tournament-a" },
    charreada: { id: "charreada-a" },
    team: { id: teamId, name: `Equipo ${teamId}` },
    suerte: { id: "colas", type: "coleadero" },
    coleadorIndex,
    attemptIndex,
    charro,
    total,
    revision: 1,
    superseded: false
  };
}

function assertTernaRoleMatrix() {
  let session = createFmch2026TernaSession({
    tournamentId: "tournament-a",
    competitionId: "equipos_completo",
    charreadaId: "charreada-a",
    teamId: "team-terna"
  });
  const sharedTimerId = session.sharedTimerId;

  session = consumeTerna(session, "HEAD", false);
  assert.equal(resolveFmch2026TernaNextSuerteId(session), "lazo", "A: Cabecero fail stays Cabecero");
  session = consumeTerna(session, "HEAD", false);
  assert.equal(resolveFmch2026TernaNextSuerteId(session), "lazo", "B: repeated Cabecero fail stays Cabecero");
  session = consumeTerna(session, "HEAD", true);
  assert.equal(resolveFmch2026TernaNextSuerteId(session), "pial_ruedo", "D: Cabecero success advances to Pial");
  session = consumeTerna(session, "PIAL", false);
  assert.equal(resolveFmch2026TernaNextSuerteId(session), "pial_ruedo", "E: Pial fail stays Pial");
  session = consumeTerna(session, "PIAL", false);
  assert.equal(session.history.length, FMCH_2026_TERNA_OPPORTUNITY_LIMIT, "G: the shared pool stops at five");
  assert.equal(session.currentOpportunity, null);
  assert.equal(session.sharedTimerId, sharedTimerId, "the shared timer identity never changes");
  assert.equal(buildFmch2026TernaOpportunityDraft(session, { type: "PIAL" }).ok, false);

  let closable = createFmch2026TernaSession({
    tournamentId: "tournament-a",
    competitionId: "equipos_completo",
    charreadaId: "charreada-a",
    teamId: "team-close"
  });
  closable = consumeTerna(closable, "HEAD", false);
  const closed = finishFmch2026TernaSession(closable, { closedBy: "judge-a" });
  assert.equal(closed.ok, true);
  assert.equal(closed.session.opportunities.filter((item) => item.status === "CLOSED_UNUSED").length, 4);
}

function assertTernaCanonicalSuccessTransitions() {
  const failed = canonicalTernaCompletion({ status: "NOT_ACHIEVED", result: "NOT_ACHIEVED" });
  const successfulHead = canonicalTernaCompletion({
    status: "VALID",
    result: "ACHIEVED",
    selectedBaseRuleId: "lazo_base_sencillo"
  });
  const successfulPial = canonicalTernaCompletion({
    status: "VALID",
    result: "ACHIEVED",
    selectedBaseRuleId: "pial_ruedo_base_sencillo"
  });
  assert.equal(failed.completed, false);
  assert.equal(successfulHead.completed, true);
  assert.equal(successfulPial.completed, true);
  assert.equal(canonicalTernaCompletion({
    status: "VALID",
    result: "ACHIEVED",
    netAttemptPoints: 20
  }).completed, false, "points without a canonical base selection do not complete the role");

  let session = newTernaSession("head-fail");
  session = consumeTerna(session, "HEAD", failed.countsForTerna);
  assert.equal(resolveFmch2026TernaNextSuerteId(session), "lazo", "O1 Cabecero FAIL -> O2 Cabecero");

  session = newTernaSession("head-success");
  session = consumeTerna(session, "HEAD", successfulHead.countsForTerna);
  assert.equal(resolveFmch2026TernaNextSuerteId(session), "pial_ruedo", "O1 Cabecero SUCCESS -> O2 Pial");

  session = newTernaSession("head-fail-success");
  session = consumeTerna(session, "HEAD", failed.countsForTerna);
  session = consumeTerna(session, "HEAD", successfulHead.countsForTerna);
  assert.equal(resolveFmch2026TernaNextSuerteId(session), "pial_ruedo", "O1 FAIL + O2 SUCCESS -> O3 Pial");

  session = newTernaSession("pial-fail");
  session = consumeTerna(session, "HEAD", successfulHead.countsForTerna);
  session = consumeTerna(session, "PIAL", failed.countsForTerna);
  assert.equal(resolveFmch2026TernaNextSuerteId(session), "pial_ruedo", "O1 Cabecero SUCCESS + O2 Pial FAIL -> O3 Pial");

  session = consumeTerna(session, "PIAL", successfulPial.countsForTerna);
  assert.equal(resolveFmch2026TernaNextSuerteId(session), null, "Pial SUCCESS completes the role sequence");
  assert.equal(session.status, "COMPLETED", "O1 SUCCESS + O2 FAIL + O3 SUCCESS completes Terna at 3/5");
  assert.equal(session.currentOpportunity, null);
  assert.equal(session.history.length, 3);
  assert.equal(session.opportunities.filter((item) => item.status === "CLOSED_UNUSED").length, 2);

  session = newTernaSession("success-success");
  const sharedTimerId = session.sharedTimerId;
  session = consumeTerna(session, "HEAD", successfulHead.countsForTerna);
  session = consumeTerna(session, "PIAL", successfulPial.countsForTerna);
  assert.equal(session.status, "COMPLETED", "O1 Cabecero SUCCESS + O2 Pial SUCCESS -> FIN TERNA at 2/5");
  assert.equal(session.currentOpportunity, null);
  assert.equal(session.history.length, 2);
  assert.equal(session.opportunities.filter((item) => item.status === "CLOSED_UNUSED").length, 3);
  assert.equal(session.sharedTimerId, sharedTimerId, "sporting completion preserves the shared timer authority");
  assert.deepEqual(session.history.map((item) => item.scoreId), ["score-1", "score-2"],
    "sporting completion preserves published score references");
  assert.equal(buildFmch2026TernaOpportunityDraft(session, { type: "PIAL" }).ok, false,
    "sporting completion cannot reserve O3");

  session = newTernaSession("fail-success-success");
  session = consumeTerna(session, "HEAD", failed.countsForTerna);
  session = consumeTerna(session, "HEAD", successfulHead.countsForTerna);
  session = consumeTerna(session, "PIAL", successfulPial.countsForTerna);
  assert.equal(session.status, "COMPLETED", "O1 FAIL + O2 Cabecero SUCCESS + O3 Pial SUCCESS -> FIN TERNA at 3/5");
  assert.equal(session.currentOpportunity, null);
  assert.equal(session.history.length, 3);
  assert.equal(session.opportunities.filter((item) => item.status === "CLOSED_UNUSED").length, 2);

  session = newTernaSession("success-pial-fail");
  session = consumeTerna(session, "HEAD", successfulHead.countsForTerna);
  session = consumeTerna(session, "PIAL", failed.countsForTerna);
  assert.equal(session.status, "IN_PROGRESS", "Cabecero SUCCESS + Pial FAIL does not finish Terna");
  assert.equal(session.currentOpportunity, 3);
  assert.equal(resolveFmch2026TernaNextSuerteId(session), "pial_ruedo");
  assert.equal(session.opportunities.filter((item) => item.status === "CLOSED_UNUSED").length, 0);

  const zeroNetButSelected = canonicalTernaCompletion({
    status: "VALID",
    result: "ACHIEVED",
    selectedBaseRuleId: "lazo_base_sencillo",
    netAttemptPoints: 0
  });
  assert.equal(zeroNetButSelected.completed, true, "completion follows the canonical base selection, not score > 0");

  const adaptedScorerAttempt = adaptLegacyAttemptToV2({
    base: 5,
    applied: ["lazo_base_sencillo"],
    remateId: "lazo_base_sencillo",
    remateLabel: "Sencillo",
    notAchieved: false,
    desc: null
  }, {
    tournamentId: "tournament-a",
    competitionId: "equipos_completo",
    competitionScope: "team",
    charreadaId: "charreada-a",
    teamId: "team-adapter",
    suerteId: "lazo",
    opportunityNumber: 1,
    catalog: {
      base: FMCH_2026_LAZO_BASE_RULES,
      adic: [],
      infr: [],
      team_infr: [],
      desc: []
    }
  });
  assert.equal(adaptedScorerAttempt.scoring.baseSelection?.selectedRuleId, "lazo_base_sencillo");
  assert.equal(resolveFmch2026TernaAttemptCompletion(adaptedScorerAttempt).completed, true,
    "the real scorer adapter exposes the successful Cabecero base selection");
}

function canonicalTernaCompletion({ status, result, selectedBaseRuleId = null, netAttemptPoints = 0 }) {
  return resolveFmch2026TernaAttemptCompletion({
    sportState: { status, result },
    scoring: {
      baseSelection: selectedBaseRuleId ? { selectedRuleId: selectedBaseRuleId } : null,
      netAttemptPoints
    }
  });
}

function newTernaSession(teamId) {
  return createFmch2026TernaSession({
    tournamentId: "tournament-a",
    competitionId: "equipos_completo",
    charreadaId: "charreada-a",
    teamId
  });
}

function consumeTerna(session, type, countsForTerna) {
  const draft = buildFmch2026TernaOpportunityDraft(session, {
    type,
    participantId: `${type.toLowerCase()}-participant`,
    result: countsForTerna ? "VALID" : "ZERO",
    countsForTerna
  });
  assert.equal(draft.ok, true);
  const reserved = reserveFmch2026TernaOpportunity(session, draft.opportunity);
  assert.equal(reserved.ok, true);
  const committed = commitFmch2026TernaOpportunity(reserved.session, draft.opportunity, {
    scoreId: `score-${draft.opportunity.sharedSequenceNumber}`,
    publishedScoreId: `published-${draft.opportunity.sharedSequenceNumber}`
  });
  assert.equal(committed.ok, true);
  return committed.session;
}
