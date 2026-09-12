import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  getCharreadaParticipants,
  getCharreadaScoringEntries,
  getTournamentHorses,
  getTournamentParticipants,
  getTournamentTeams,
  state
} from "../js/core/state.js?v=20260912-portal-v2-home-visual-adjustments-003-v1";
import { buildCanonicalPublicProjectionV3 as buildBrowserProjection } from "../js/public/canonicalPublicProjectionV3.js?v=20260912-portal-v2-home-visual-adjustments-003-v1";
import { buildCanonicalPublicProjectionV3 as buildFunctionProjection } from "../functions/reconciliationShared/public/canonicalPublicProjectionV3.js?v=20260912-portal-v2-home-visual-adjustments-003-v1";

const previous = structuredClone({
  activeTournamentId: state.activeTournamentId,
  activeCharreadaId: state.activeCharreadaId,
  tournaments: state.tournaments,
  teams: state.teams,
  participants: state.participants,
  horses: state.horses,
  charreadas: state.charreadas,
  scores: state.scores
});

try {
  const individualTournamentId = "coleadero-canonical-registries";
  const teamTournamentId = "team-canonical-registries";
  const horses = [
    horse("horse-01", "El Guero"),
    horse("horse-02", "La Mora", { registryType: "AQHA", registryNumber: "1234567" }),
    horse("horse-03", "El Guero")
  ];
  const participants = [
    participant("participant-01", "Juan Perez", "horse-01"),
    participant("participant-02", "Juan Perez", "horse-02"),
    participant("participant-03", "Luis Perez", "horse-03"),
    { ...participant("participant-inactive", "Inactivo", "horse-01"), status: "inactive" }
  ];
  const coleadero = individualLot("coleadero-lot", individualTournamentId, "coleadero", ["participant-02", "participant-01", "participant-03"]);
  const caladero = individualLot("caladero-lot", individualTournamentId, "caladero", ["participant-03", "participant-01"]);
  const teamsLot = { id: "teams-lot", tournamentId: teamTournamentId, competitionType: "equipos_completo", competitionScope: "team", teamIds: ["team-a"], participantIds: [] };

  state.activeTournamentId = individualTournamentId;
  state.activeCharreadaId = coleadero.id;
  state.tournaments = [{ id: individualTournamentId, type: "coleadero" }, { id: teamTournamentId, type: "completo" }];
  state.teams = [{ id: "team-a", tournamentId: teamTournamentId, name: "Equipo A" }];
  state.participants = participants;
  state.horses = horses;
  state.charreadas = [coleadero, caladero, teamsLot];
  state.scores = {};

  // Team registration remains isolated from individual registrations.
  assert.deepEqual(getTournamentTeams(teamTournamentId).map((team) => team.id), ["team-a"]);
  assert.deepEqual(getTournamentParticipants(teamTournamentId), []);
  assert.deepEqual(getTournamentHorses(teamTournamentId), []);

  // Individual entries keep participant and horse identities, even when names repeat.
  assert.deepEqual(getTournamentParticipants(individualTournamentId).map((entry) => entry.id), ["participant-01", "participant-02", "participant-03"]);
  assert.deepEqual(getTournamentHorses(individualTournamentId).map((entry) => entry.id), ["horse-01", "horse-02", "horse-03"]);
  assert.equal(getTournamentParticipants(individualTournamentId)[0].participantName, getTournamentParticipants(individualTournamentId)[1].participantName);
  assert.notEqual(getTournamentParticipants(individualTournamentId)[0].horseId, getTournamentParticipants(individualTournamentId)[1].horseId);
  assert.equal(getTournamentHorses(individualTournamentId)[0].displayName, getTournamentHorses(individualTournamentId)[2].displayName);
  assert.notEqual(getTournamentHorses(individualTournamentId)[0].id, getTournamentHorses(individualTournamentId)[2].id);
  assert.equal(getTournamentHorses(individualTournamentId)[1].registryType, "AQHA");
  assert.equal(getTournamentHorses(individualTournamentId)[0].registryType, null);

  assert.deepEqual(getCharreadaParticipants(coleadero).map((entry) => entry.id), ["participant-02", "participant-01", "participant-03"]);
  assert.deepEqual(getCharreadaScoringEntries(coleadero).map((entry) => entry.horseName), ["La Mora", "El Guero", "El Guero"]);
  assert.deepEqual(getCharreadaScoringEntries(caladero).map((entry) => entry.id), ["participant-03", "participant-01"]);
  assert.deepEqual(getCharreadaScoringEntries(teamsLot).map((entry) => entry.id), ["team-a"]);

  const projectionSource = {
    tournament: {
      id: individualTournamentId,
      name: "Coleadero individual",
      type: "coleadero",
      status: "en_vivo",
      teams: [],
      participants,
      horses,
      charreadas: [{ ...coleadero, name: "Primer lote", status: "en_vivo" }],
      publishedScores: {}
    },
    liveCurrent: { activeCharreadaId: coleadero.id, status: "LIVE" }
  };
  const options = { tournamentId: individualTournamentId, nowMs: Date.parse("2026-09-10T00:00:00.000Z") };
  const browserProjection = buildBrowserProjection(projectionSource, options);
  const functionProjection = buildFunctionProjection(projectionSource, options);
  const program = browserProjection.program.items[0];
  assert.deepEqual(program.participantIds, ["participant-02", "participant-01", "participant-03"]);
  assert.deepEqual(program.participantNames, ["Juan Perez", "Juan Perez", "Luis Perez"]);
  assert.deepEqual(program.horseIds, ["horse-02", "horse-01", "horse-03"]);
  assert.deepEqual(program.horseNames, ["La Mora", "El Guero", "El Guero"]);
  assert.equal(program.teamIds, undefined, "Portal V3 does not manufacture a team for an individual lot");
  assert.deepEqual(functionProjection.program, browserProjection.program, "browser and Function mirrors preserve the same registries");

  const appSource = await readFile(new URL("../js/app.js", import.meta.url), "utf8");
  const syncSource = await readFile(new URL("../js/core/firebaseSync.js", import.meta.url), "utf8");
  assert.match(appSource, /getTournamentParticipants\(tournament\?\.id\)/, "lot selection reads the participant registry");
  assert.match(appSource, /name="horseId"/, "registration allows an existing horse identity");
  assert.match(appSource, /state\.participants\.push/, "registration persists individual entries separately");
  assert.match(appSource, /state\.horses\.push/, "registration persists horses separately");
  assert.doesNotMatch(appSource, /getTournamentIndividualParticipants/, "no participant-to-team adapter remains");
  assert.match(syncSource, /participants: participants\.map\(compactStoredParticipant\)/, "sync persists the participant registry independently");
  assert.match(syncSource, /horses: horses\.map\(compactStoredHorse\)/, "sync persists the horse registry independently");
  const compactTeamSource = syncSource.slice(syncSource.indexOf("function compactStoredTeam"), syncSource.indexOf("function compactStoredParticipant"));
  assert.match(compactTeamSource, /horseName: _horseName/, "team serialization explicitly removes legacy horse text");
  assert.doesNotMatch(compactTeamSource, /\n\s*horseName\s*:/, "team serialization never emits individual horse text");

  console.log("individual-competition-participant-source.test.mjs: ok");
} finally {
  Object.assign(state, previous);
}

function participant(id, participantName, horseId) {
  return { id, tournamentId: "coleadero-canonical-registries", participantName, horseId, association: "Asociacion prueba", category: "Libre", active: true };
}

function horse(id, displayName, registry = {}) {
  return { id, tournamentId: "coleadero-canonical-registries", displayName, registryType: registry.registryType || null, registryNumber: registry.registryNumber || null, registryVerified: false };
}

function individualLot(id, tournamentId, competitionType, participantIds) {
  return { id, tournamentId, competitionType, competitionScope: "individual", participantIds, teamIds: [] };
}
