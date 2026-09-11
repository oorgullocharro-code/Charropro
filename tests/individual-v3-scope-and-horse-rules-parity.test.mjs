import assert from "node:assert/strict";
import { buildCanonicalPublicProjectionV3 as buildBrowserProjection } from "../js/public/canonicalPublicProjectionV3.js?v=20260911-graphics-access-coleadero-tournament-button-001-v1";
import { buildCanonicalPublicProjectionV3 as buildFunctionProjection } from "../functions/reconciliationShared/public/canonicalPublicProjectionV3.js?v=20260911-graphics-access-coleadero-tournament-button-001-v1";

const NOW_MS = Date.parse("2026-09-10T00:00:00.000Z");

const individual = buildBoth(individualSource());
const individualResult = individual.browser.results.teams[0];
assert.deepEqual(individual.functionProjection, individual.browser, "browser and shared mirror retain individual V3 parity");
assert.equal(individualResult.participantScope, "individual");
assert.equal(individualResult.participantId, "participant-gustavo");
assert.equal(individualResult.participantName, "Gustavo Mares");
assert.equal(individualResult.teamId, "", "individual V3 does not retain a legacy team surrogate");
assert.equal(individualResult.horseId, "horse-moro");
assert.equal(individualResult.horseName, "Moro");
assert.equal(individualResult.total, 15);
assert.equal(individual.browser.standings.items[0].horseId, "horse-moro");
assert.equal(individual.browser.standings.items[0].horseName, "Moro");
assert.equal(individual.browser.sheet.competitions[0].rows[0].horseId, "horse-moro");
assert.equal(individual.browser.sheet.competitions[0].rows[0].horseName, "Moro");
assert.equal(individual.browser.program.items[0].participantScope, "individual");
assert.equal(individual.browser.live.participantScope, "individual");
assert.equal(individual.browser.live.currentTeam, undefined, "individual V3 does not fabricate a team presentation field");
assert.equal(individual.browser.live.currentParticipant, "Gustavo Mares");
assert.equal(individual.browser.live.currentHorseId, "horse-moro");
assert.equal(individual.browser.live.currentHorseName, "Moro");

// Scope precedence is stable: record > competition.scope > competition.participantScope
// > competition.competitionScope > Attempt V2 identity > legacy identity inference.
assert.equal(scopeOf({ participantScope: "team", competition: { scope: "individual", participantScope: "individual", competitionScope: "individual" } }), "team");
assert.equal(scopeOf({ competition: { scope: "team", participantScope: "individual", competitionScope: "individual" } }), "team");
assert.equal(scopeOf({ competition: { participantScope: "team", competitionScope: "individual" } }), "team");
assert.equal(scopeOf({ competition: { competitionScope: "individual" } }), "individual");
assert.equal(scopeOf({ attemptScope: "individual" }), "individual");

const team = buildBoth(teamSource());
const teamResult = team.browser.results.teams[0];
assert.deepEqual(team.functionProjection, team.browser, "browser and shared mirror retain team V3 parity");
assert.equal(team.browser.program.items[0].teamIds[0], "team-zacatecas");
assert.equal(team.browser.program.items[0].participantIds, undefined, "team program does not resolve participants");
assert.equal(teamResult.participantScope, "team");
assert.equal(teamResult.teamId, "team-zacatecas");
assert.equal(teamResult.teamName, "Zacatecas");
assert.equal(teamResult.horseId, "");
assert.equal(teamResult.horseName, "");
assert.equal(team.browser.standings.items[0].teamId, "team-zacatecas");
assert.equal(team.browser.standings.items[0].teamName, "Zacatecas");
assert.equal(team.browser.sheet.competitions[0].rows[0].teamId, "team-zacatecas");
assert.equal(team.browser.sheet.competitions[0].rows[0].teamName, "Zacatecas");
assert.deepEqual(team.browser.results, team.functionProjection.results, "team results remain identical");
assert.deepEqual(team.browser.standings, team.functionProjection.standings, "team standings remain identical");
assert.deepEqual(team.browser.sheet, team.functionProjection.sheet, "team sheet remains identical");

console.log("individual-v3-scope-and-horse-rules-parity.test.mjs: ok");

function buildBoth(source) {
  const options = { tournamentId: source.tournament.info.id, nowMs: NOW_MS };
  return {
    browser: buildBrowserProjection(source, options),
    functionProjection: buildFunctionProjection(source, options)
  };
}

function scopeOf(overrides) {
  const source = individualSource();
  const record = source.tournament.officialScoreLedger.gustavo.records["official-gustavo"];
  if (overrides.participantScope) record.participantScope = overrides.participantScope;
  if (overrides.competition) record.competition = { ...record.competition, ...overrides.competition };
  if (overrides.attemptScope) record.breakdown.attemptV2.identity.participantScope = overrides.attemptScope;
  return buildBoth(source).browser.results.teams[0].participantScope;
}

function individualSource() {
  const tournamentId = "individual-v3-scope";
  const charreadaId = "charreada-coleadero";
  const record = {
    id: "official-gustavo",
    revision: 1,
    status: "active",
    officialStatus: "active",
    published: true,
    publishedAt: "2026-09-10T00:00:00.000Z",
    timestampMs: NOW_MS,
    total: 15,
    tournament: { id: tournamentId },
    charreada: { id: charreadaId, competitionId: "coleadero" },
    competition: { id: "coleadero", competitionScope: "individual", competitionType: "coleadero" },
    team: { id: "participant-gustavo", name: "Gustavo Mares / Moro" },
    suerte: { id: "colas" },
    breakdown: {
      attemptV2: {
        identity: {
          tournamentId,
          charreadaId,
          competitionId: "coleadero",
          participantId: "participant-gustavo",
          participantSlot: 1,
          suerteId: "colas",
          opportunityNumber: 1
        },
        sportState: { opportunity: { number: 1 } },
        scoring: { teamAdjustedPoints: 15, individualBadPoints: 0, teamBadPoints: 0 }
      }
    }
  };
  return {
    tournament: {
      info: { id: tournamentId, nombre: "Coleadero Individual", type: "coleadero", status: "en_vivo" },
      teams: [],
      participants: [{ id: "participant-gustavo", participantName: "Gustavo Mares", horseId: "horse-moro" }],
      horses: [{ id: "horse-moro", displayName: "Moro" }],
      charreadas: [{ id: charreadaId, competitionId: "coleadero", competitionScope: "individual", name: "Lote Coleadero", participantIds: ["participant-gustavo"] }],
      publishedScores: { "official-gustavo": record },
      officialScoreLedger: { gustavo: { activeRecordId: "official-gustavo", records: { "official-gustavo": record } } }
    },
    liveCurrent: {
      activeCharreadaId: charreadaId,
      status: "LIVE",
      turn: {
        competition: { scope: "individual" },
        participant: { id: "participant-gustavo", name: "Gustavo Mares", horseId: "horse-moro", horseName: "Moro" },
        horse: { id: "horse-moro", name: "Moro" }
      }
    }
  };
}

function teamSource() {
  const tournamentId = "team-v3-parity";
  const charreadaId = "charreada-team";
  const record = {
    id: "official-zacatecas",
    revision: 1,
    status: "active",
    officialStatus: "active",
    published: true,
    publishedAt: "2026-09-10T00:00:00.000Z",
    timestampMs: NOW_MS,
    total: 32,
    tournament: { id: tournamentId },
    charreada: { id: charreadaId, competitionId: "equipos_completo" },
    competition: { id: "equipos_completo", competitionScope: "team", competitionType: "equipos_completo" },
    team: { id: "team-zacatecas", name: "Zacatecas" },
    suerte: { id: "cala" },
    breakdown: {
      attemptV2: {
        identity: { tournamentId, charreadaId, competitionId: "equipos_completo", teamId: "team-zacatecas", suerteId: "cala", opportunityNumber: 1 },
        sportState: { opportunity: { number: 1 } },
        scoring: { teamAdjustedPoints: 32, individualBadPoints: 0, teamBadPoints: 0 }
      }
    }
  };
  return {
    tournament: {
      info: { id: tournamentId, nombre: "Charreada por equipos", type: "equipos_completo", status: "en_vivo" },
      teams: [{ id: "team-zacatecas", name: "Zacatecas" }],
      participants: [{ id: "participant-unrelated", participantName: "No debe aparecer", horseId: "horse-unrelated" }],
      horses: [{ id: "horse-unrelated", displayName: "No debe aparecer" }],
      charreadas: [{ id: charreadaId, competitionId: "equipos_completo", competitionScope: "team", name: "Charreada Oficial", teamIds: ["team-zacatecas"] }],
      publishedScores: { "official-zacatecas": record },
      officialScoreLedger: { zacatecas: { activeRecordId: "official-zacatecas", records: { "official-zacatecas": record } } }
    },
    liveCurrent: { activeCharreadaId: charreadaId, status: "LIVE" }
  };
}
