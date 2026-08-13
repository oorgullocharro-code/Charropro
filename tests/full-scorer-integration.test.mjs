import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.get(String(key)) ?? null,
  setItem: (key, value) => storage.set(String(key), String(value)),
  removeItem: (key) => storage.delete(String(key))
};

const {
  emptyAttempt,
  ensureScoresForCharreada,
  getCharreadaScoringSuertes,
  getCurrentContext,
  state
} = await import("../js/core/state.js?v=20260811-official-timer-authority-sync-001-v1");
const { advanceScoringPointer } = await import("../js/core/flow.js?v=20260811-official-timer-authority-sync-001-v1");
const {
  createPendingScoreReview,
  listPendingScoreReviews,
  putPendingScoreReview
} = await import("../js/core/pendingScoreReview.js?v=20260811-official-timer-authority-sync-001-v1");

const tournamentId = "demo-local-fmch-2026";
const charreadaId = "demo-local-fmch-jornada-1";
const teamIds = ["equipo-a", "equipo-b", "equipo-c"];
state.schemaVersion = 2;
state.view = "scoring";
state.activeTournamentId = tournamentId;
state.activeCharreadaId = charreadaId;
state.scoringSuerteIdx = 0;
state.scoringTeamIdx = 0;
state.scoringAttemptIdx = 0;
state.scoringColeadorIdx = 0;
state.tournaments = [{ id: tournamentId, name: "FMCH local", type: "completo", ruleOverrides: {} }];
state.teams = teamIds.map((id, index) => ({
  id,
  tournamentId,
  name: `Equipo ${String.fromCharCode(65 + index)}`,
  roster: { cala: `Charro ${index + 1}`, colas: [`Coleador ${index + 1}`, "", ""] }
}));
state.charreadas = [{
  id: charreadaId,
  tournamentId,
  name: "Jornada sintética",
  status: "en_vivo",
  competitionId: "equipos_completo",
  competitionType: "equipos_completo",
  competitionScope: "team",
  suerteIds: ["cala", "piales", "colas", "toro", "terna", "yegua", "manganas_pie", "manganas_caballo", "paso"],
  teamIds
}];
state.scores = {};
state.pendingScoreReviews = {};
state.settings = { globalRuleOverrides: {}, scoringButtonLayouts: {}, graphicsConfig: {} };
ensureScoresForCharreada(charreadaId);

const expectedSuertes = [
  "cala",
  "piales",
  "colas",
  "toro",
  "lazo",
  "pial_ruedo",
  "yegua",
  "manganas_pie",
  "manganas_caballo",
  "paso"
];
assert.deepEqual(
  getCharreadaScoringSuertes(state.charreadas[0], state.tournaments[0]).map((suerte) => suerte.id),
  expectedSuertes
);

const visited = new Set();
const visitedTeams = new Set();
let steps = 0;
while (state.view === "scoring" && steps < 500) {
  const context = getCurrentContext();
  assert.ok(context, `missing context at step ${steps}`);
  visited.add(context.suerte.id);
  visitedTeams.add(context.team.id);
  assert.ok(context.attempt, `missing attempt for ${context.suerte.id}`);
  advanceScoringPointer();
  steps += 1;
}
assert.ok(steps > 30, "full scorer sequence must traverse attempts, teams and suertes");
assert.deepEqual([...visited], expectedSuertes);
assert.deepEqual([...visitedTeams].sort(), teamIds);
assert.equal(state.view, "results");

const actor = { uid: "judge-local-1", name: "Juez Local", role: "juez", clientId: "device-a" };
const pendingDefinitions = [
  {
    suerteId: "cala",
    attemptIndex: 0,
    teamId: "equipo-a",
    draftSnapshot: { scorePayload: [{ ...emptyAttempt(), base: 20, note: "Cala pendiente" }] }
  },
  {
    suerteId: "lazo",
    attemptIndex: 1,
    teamId: "equipo-b",
    sharedOpportunityId: "terna-equipo-b-op-2",
    sharedSequenceNumber: 2,
    draftSnapshot: {
      scorePayload: [{ ...emptyAttempt() }, {
        ...emptyAttempt(),
        base: 10,
        sharedOpportunityId: "terna-equipo-b-op-2",
        sharedSequenceNumber: 2,
        sharedTimerId: "terna-equipo-b-timer"
      }]
    }
  },
  {
    suerteId: "manganas_pie",
    attemptIndex: 1,
    teamId: "equipo-c",
    sharedOpportunityId: "manganas-pie-equipo-c-op-2",
    sharedSequenceNumber: 2,
    draftSnapshot: {
      scorePayload: [{ ...emptyAttempt() }, {
        ...emptyAttempt(),
        manganaResult: "NOT_STARTED",
        floreoTotal: 4,
        floreoDetail: [{ id: "floreo-mp", points: 4 }],
        pullCount: 2,
        remateId: "remate-rodado",
        timing: { timerId: "manganas-pie-2", remainingMs: 92000 }
      }]
    }
  },
  {
    suerteId: "paso",
    attemptIndex: 0,
    teamId: "equipo-c",
    draftSnapshot: {
      scorePayload: [{
        ...emptyAttempt(),
        pasoResult: "NOT_STARTED",
        pasoVuelta: 2,
        timing: { timerId: "paso-3m", remainingMs: 120000 },
        timeEvidence: [{ id: "paso-evidence" }]
      }]
    }
  }
];

pendingDefinitions.forEach((definition, index) => {
  const record = createPendingScoreReview({
    tournamentId,
    competitionId: "equipos_completo",
    charreadaId,
    participantScope: "team",
    scoreId: `${charreadaId}__${definition.teamId}__${definition.suerteId}`,
    reason: { code: "other", label: "Revisión", note: "" },
    metadata: { suerteName: definition.suerteId, entryName: definition.teamId },
    ...definition
  }, { actor, now: `2026-08-11T13:0${index}:00.000Z` });
  const stored = putPendingScoreReview(state.pendingScoreReviews, record);
  assert.equal(stored.ok, true);
  state.pendingScoreReviews = stored.registry;
});

const activePending = listPendingScoreReviews(state.pendingScoreReviews, {
  tournamentId,
  status: "pending_review"
});
assert.equal(activePending.length, 4);
assert.equal(activePending.find((item) => item.suerteId === "lazo").draftSnapshot.scorePayload[1].sharedSequenceNumber, 2);
assert.equal(activePending.find((item) => item.suerteId === "manganas_pie").draftSnapshot.scorePayload[1].remateId, "remate-rodado");
assert.equal(activePending.find((item) => item.suerteId === "paso").draftSnapshot.scorePayload[0].timeEvidence[0].id, "paso-evidence");

const appSource = await readFile(new URL("../js/app.js", import.meta.url), "utf8");
const footer = appSource.slice(appSource.indexOf("function renderScoringBottomBar"), appSource.indexOf("function hasAttemptScoringActivity"));
assert.ok(footer.indexOf('data-action="previous-score"') < footer.indexOf('data-action="toggle-attempt-zero"'));
assert.ok(footer.indexOf('data-action="toggle-attempt-zero"') < footer.indexOf('data-action="show-pending-review-create"'));
assert.ok(footer.indexOf('data-action="show-pending-review-create"') < footer.indexOf('data-action="next-score"'));
assert.match(footer, /Pendientes \$\{pendingCount\}/);
assert.match(appSource, /advanceScoringPointer\(\);[\s\S]{0,120}saveScoringNavigationDraft\(\);/);
assert.match(appSource, /timerAuthority: "independent"/);
assert.match(appSource, /Resolviendo pendiente/);
assert.match(appSource, /Resolver y publicar/);

console.log("full scorer integration tests passed");
