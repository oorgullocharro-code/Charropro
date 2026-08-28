import assert from "node:assert/strict";
import {
  buildPublicProjection,
  getPublicProjectionSignature,
  reconcilePublicProjection
} from "../js/public/publicProjection.js?v=20260828-fmch-terna-federation-format-official-score-recovery-001b-v1";
import {
  diagnosePublicProjectionFirebaseCompatibility,
  normalizePublicProjectionForFirebase,
  sanitizePublicProjectionValue,
  stablePublicStringify,
  validatePublicProjection
} from "../js/public/publicProjectionSchema.js?v=20260828-fmch-terna-federation-format-official-score-recovery-001b-v1";
import { adaptPublicProjectionToLegacy } from "../js/public/publicProjectionLegacyAdapter.js?v=20260828-fmch-terna-federation-format-official-score-recovery-001b-v1";

const baseSource = buildSource();
const candidate = buildPublicProjection(baseSource, {
  tournamentId: "tournament-public-qa",
  nowMs: Date.parse("2026-07-27T14:00:00.000Z")
});
const initial = reconcilePublicProjection(null, candidate, {
  nowMs: Date.parse("2026-07-27T14:00:00.000Z")
});

assert.equal(initial.ok, true);
assert.equal(initial.changed, true);
assert.equal(initial.projection.schemaVersion, 2);
assert.equal(initial.projection.projectionRevision, 1);
assert.deepEqual(validatePublicProjection(initial.projection).errors, []);
assert.equal(initial.projection.live.turn.team.id, "team-b");
assert.equal(initial.projection.live.turn.team.name, "Equipo B");
assert.notEqual(initial.projection.live.turn.team.id, "team-a", "last scored team never replaces official turn");
assert.equal(initial.projection.overview.activeCharreadaId, "charreada-team");
assert.equal(initial.projection.overview.activeCompetitionId, "competition-team-aa");
assert.equal(initial.projection.overview.contextConsistency, "live-current-preferred");
const teamProgramItem = initial.projection.program.items.find((item) => item.charreadaId === "charreada-team");
assert.equal(teamProgramItem.competitionName, "Competencia por equipos");
assert.equal(teamProgramItem.categoryName, "AA");
assert.equal(teamProgramItem.phaseName, "Clasificatoria");
assert.equal(teamProgramItem.venueName, "Lienzo Norte");
assert.equal(teamProgramItem.endTime, "17:00");
assert.equal(teamProgramItem.liveAvailable, true);
assert.equal(teamProgramItem.resultsAvailable, true);
assert.deepEqual(teamProgramItem.participants.map((participant) => participant.name), ["Equipo B", "Equipo A"]);
assert.deepEqual(teamProgramItem.participants.map((participant) => participant.order), [1, 2]);
assert.equal("association" in teamProgramItem, false);
assert.equal("association" in teamProgramItem.participants[0], false);

assert.equal(initial.projection.results.items.length, 3, "superseded score and private raw score are excluded");
assert.equal(initial.projection.results.items.some((row) => row.subtotal === 999), false, "private raw score is absent");
const teamResult = initial.projection.results.items.find((row) => row.teamId === "team-a");
assert.equal(teamResult.subtotal, 35, "attempt/breakdown total wins over anomalous top-level 280");
assert.equal(teamResult.scores.CC, 35);
assert.equal(teamResult.officialPosition, null);
assert.equal(teamResult.accumulatedTotal, 35);
assert.equal(teamResult.provisionalPosition, 1);
assert.equal(teamResult.positionStatus, "provisional");
assert.equal(teamResult.totalStatus, "partial");

const individualResult = initial.projection.results.items.find((row) => row.participantId === "participant-1");
assert.ok(individualResult);
assert.equal(individualResult.teamId, null, "individual competition never invents teamId");
assert.equal(individualResult.participantName, "Ana Charra");
assert.equal(individualResult.horseName, "Relámpago");
assert.equal(individualResult.competitionType, "charro_completo");
assert.equal(individualResult.scores.PM, 24);
assert.equal(individualResult.teamPenaltyTotal, -4);

const competitionIds = initial.projection.competitions.items.map((row) => row.competitionId);
assert.ok(competitionIds.includes("competition-team-aa"));
assert.ok(competitionIds.includes("competition-charro-libre"));
assert.ok(competitionIds.includes("competition-charro-juvenil"), "same type remains separated by instance");
assert.equal(new Set(competitionIds).size, competitionIds.length);
const legacyView = adaptPublicProjectionToLegacy(initial.projection);
const legacyCompetitionIds = legacyView.competitions.map((row) => row.competitionId);
assert.ok(legacyCompetitionIds.includes("competition-charro-libre"));
assert.ok(legacyCompetitionIds.includes("competition-charro-juvenil"));
assert.equal(new Set(legacyCompetitionIds).size, legacyCompetitionIds.length);
assert.equal(initial.projection.rankings.status, "unavailable");
assert.deepEqual(initial.projection.rankings.items, []);
assert.equal(initial.projection.statistics.status, "unavailable");
assert.equal(initial.projection.search.status, "unavailable");

const serialized = JSON.stringify(initial.projection);
for (const privateTerm of [
  "private@example.test",
  "pendingNote",
  "operatorId",
  "broadcastState",
  "<script>",
  "Asociación Norte",
  "Asociación Sur",
  "Asociación Centro"
]) {
  assert.equal(serialized.includes(privateTerm), false, `${privateTerm} is not public`);
}

const duplicateCandidate = buildPublicProjection(baseSource, {
  tournamentId: "tournament-public-qa",
  nowMs: Date.parse("2026-07-27T14:01:00.000Z")
});
const duplicate = reconcilePublicProjection(initial.projection, duplicateCandidate, {
  nowMs: Date.parse("2026-07-27T14:01:00.000Z")
});
assert.equal(duplicate.ok, true);
assert.equal(duplicate.changed, false);
assert.equal(duplicate.reason, "unchanged");
assert.equal(duplicate.projection.projectionRevision, 1);
assert.equal(
  getPublicProjectionSignature(initial.projection),
  getPublicProjectionSignature({ ...initial.projection, generatedAt: "2030-01-01T00:00:00.000Z" }),
  "volatile timestamps do not change stable signature"
);

const turnChangedSource = structuredClone(baseSource);
turnChangedSource.liveCurrent.turn.team = { id: "team-a", name: "Equipo A" };
turnChangedSource.liveCurrent.timestamp = "2026-07-27T13:02:00.000Z";
const turnChanged = reconcilePublicProjection(
  initial.projection,
  buildPublicProjection(turnChangedSource, {
    tournamentId: "tournament-public-qa",
    nowMs: Date.parse("2026-07-27T14:02:00.000Z")
  }),
  { nowMs: Date.parse("2026-07-27T14:02:00.000Z") }
);
assert.equal(turnChanged.ok, true);
assert.equal(turnChanged.changed, true);
assert.equal(turnChanged.projection.projectionRevision, 2);
assert.ok(turnChanged.changedSections.includes("live"));
assert.ok(turnChanged.changedSections.includes("overview"));
assert.equal(turnChanged.projection.live.turn.team.id, "team-a");
assert.equal(turnChanged.projection.results.revision, initial.projection.results.revision);

const regressiveSource = structuredClone(baseSource);
regressiveSource.tournament.info.nombre = "Nombre regresivo";
regressiveSource.tournament.meta.updatedAt = "2026-07-26T12:00:00.000Z";
regressiveSource.liveCurrent.timestamp = "2026-07-26T12:00:00.000Z";
for (const score of Object.values(regressiveSource.tournament.publishedScores)) {
  score.publishedAt = "2026-07-26T12:00:00.000Z";
}
const regression = reconcilePublicProjection(
  initial.projection,
  buildPublicProjection(regressiveSource, { tournamentId: "tournament-public-qa", nowMs: Date.now() })
);
assert.equal(regression.ok, false);
assert.equal(regression.reason, "source-revision-regression");
assert.equal(regression.projection.projectionRevision, 1);

const legacySource = buildSource();
legacySource.tournament.charreadas = [{
  id: "legacy-charreada",
  name: "Legacy",
  teamIds: ["team-a", "team-b"]
}];
delete legacySource.tournament.info.type;
const legacy = reconcilePublicProjection(
  null,
  buildPublicProjection(legacySource, { tournamentId: "tournament-public-qa", nowMs: Date.now() })
);
assert.equal(legacy.ok, true);
assert.equal(legacy.projection.competitions.items[0].legacy, true);
assert.match(legacy.projection.competitions.items[0].competitionId, /^legacy_/);

const malicious = {};
Object.defineProperty(malicious, "secret", { enumerable: true, get() { throw new Error("getter executed"); } });
malicious.ok = 0;
malicious.no = false;
malicious.empty = "";
malicious.nil = null;
malicious.fn = () => true;
malicious.big = 10n;
malicious.self = malicious;
Object.defineProperty(malicious, "__proto__", { value: { polluted: true }, enumerable: true });
const sanitized = sanitizePublicProjectionValue(malicious);
assert.deepEqual(
  { ok: sanitized.ok, no: sanitized.no, empty: sanitized.empty, nil: sanitized.nil },
  { ok: 0, no: false, empty: "", nil: null }
);
assert.equal("secret" in sanitized, false);
assert.equal("fn" in sanitized, false);
assert.equal("big" in sanitized, false);
assert.equal("self" in sanitized, true);
assert.equal(sanitized.self, null);
assert.equal(Object.prototype.polluted, undefined);

const ordinaryFirebaseValue = normalizePublicProjectionForFirebase({ foo: "bar" });
assert.equal(ordinaryFirebaseValue.valid, true);
assert.deepEqual(ordinaryFirebaseValue.value, { foo: "bar" });
assert.equal(Object.getPrototypeOf(ordinaryFirebaseValue.value), Object.prototype);

const nullPrototypeValue = Object.create(null);
nullPrototypeValue.foo = "bar";
const nullPrototypeDiagnostics = diagnosePublicProjectionFirebaseCompatibility(nullPrototypeValue);
assert.equal(nullPrototypeDiagnostics.valid, false);
assert.ok(nullPrototypeDiagnostics.issues.some((issue) => issue.path === "snapshot" && issue.reason === "null-prototype"));
const normalizedNullPrototype = normalizePublicProjectionForFirebase(nullPrototypeValue);
assert.equal(normalizedNullPrototype.valid, true);
assert.deepEqual(normalizedNullPrototype.value, { foo: "bar" });
assert.equal(Object.getPrototypeOf(normalizedNullPrototype.value), Object.prototype);

const overriddenHasOwnProperty = { hasOwnProperty: "invalid", foo: "bar" };
const normalizedHasOwnProperty = normalizePublicProjectionForFirebase(overriddenHasOwnProperty);
assert.equal(normalizedHasOwnProperty.valid, true);
assert.equal(normalizedHasOwnProperty.value.foo, "bar");
assert.equal(Object.prototype.hasOwnProperty.call(normalizedHasOwnProperty.value, "hasOwnProperty"), false);
assert.equal(typeof normalizedHasOwnProperty.value.hasOwnProperty, "function");
assert.ok(normalizedHasOwnProperty.normalizedIssues.some((issue) => issue.reason === "has-own-property-overridden"));

const nestedNullPrototype = Object.create(null);
nestedNullPrototype.score = 33;
const nestedFirebaseValue = {
  results: {
    foo: {
      bar: nestedNullPrototype
    }
  }
};
const nestedDiagnostics = diagnosePublicProjectionFirebaseCompatibility(nestedFirebaseValue);
assert.ok(nestedDiagnostics.issues.some((issue) => (
  issue.path === "snapshot.results.foo.bar" && issue.reason === "null-prototype"
)));
const normalizedNested = normalizePublicProjectionForFirebase(nestedFirebaseValue);
assert.equal(normalizedNested.valid, true);
assert.deepEqual(normalizedNested.value.results.foo.bar, { score: 33 });

const undefinedFirebaseValue = normalizePublicProjectionForFirebase({
  omitted: undefined,
  items: ["first", undefined, { value: 0, enabled: false, label: "" }]
});
assert.equal(undefinedFirebaseValue.valid, true);
assert.equal(Object.prototype.hasOwnProperty.call(undefinedFirebaseValue.value, "omitted"), false);
assert.deepEqual(undefinedFirebaseValue.value.items, ["first", null, { value: 0, enabled: false, label: "" }]);

const arrayWithNullPrototype = Object.create(null);
arrayWithNullPrototype.id = "row-1";
const normalizedArray = normalizePublicProjectionForFirebase([arrayWithNullPrototype]);
assert.equal(normalizedArray.valid, true);
assert.deepEqual(normalizedArray.value, [{ id: "row-1" }]);
assert.equal(Object.getPrototypeOf(normalizedArray.value[0]), Object.prototype);

const cyclicFirebaseValue = { id: "cycle" };
cyclicFirebaseValue.self = cyclicFirebaseValue;
const rejectedCycle = normalizePublicProjectionForFirebase(cyclicFirebaseValue);
assert.equal(rejectedCycle.valid, false);
assert.ok(rejectedCycle.issues.some((issue) => issue.path === "snapshot.self" && issue.reason === "cyclic-reference"));

const rejectedPrototype = normalizePublicProjectionForFirebase(new Date("2026-08-07T00:00:00.000Z"));
assert.equal(rejectedPrototype.valid, false);
assert.ok(rejectedPrototype.issues.some((issue) => issue.path === "snapshot" && issue.reason === "unsupported-prototype"));

const validProjectionNormalization = normalizePublicProjectionForFirebase(initial.projection);
assert.equal(validProjectionNormalization.valid, true);
assert.equal(validProjectionNormalization.normalizedIssues.length, 0);
assert.equal(
  stablePublicStringify(validProjectionNormalization.value),
  stablePublicStringify(initial.projection),
  "Firebase normalization leaves a valid projection functionally unchanged"
);

const unsupported = structuredClone(initial.projection);
unsupported.schemaVersion = 3;
assert.equal(validatePublicProjection(unsupported).valid, false);

console.log("public-projection.test.mjs: ok");

function buildSource() {
  return {
    tournament: {
      info: {
        id: "tournament-public-qa",
        nombre: "Torneo Público <script>alert(1)</script>",
        type: "completo",
        sede: "Lienzo QA",
        ownerEmail: "private@example.test"
      },
      meta: {
        updatedAt: "2026-07-27T13:00:00.000Z",
        activeCharreadaId: "stale-charreada",
        scoringTeamIdx: 0,
        pendingNote: "private"
      },
      settings: {
        broadcastState: { operatorId: "private" }
      },
      teams: [
        { id: "team-a", name: "Equipo A", category: "AA", association: "Asociación Norte", order: 2, region: "Norte" },
        { id: "team-b", name: "Equipo B", category: "AA", association: "Asociación Sur", order: 1, region: "Sur" }
      ],
      charreadas: [
        {
          id: "charreada-team",
          name: "Equipos AA",
          competitionId: "competition-team-aa",
          competitionType: "equipos_completo",
          categoryId: "aa",
          categoryName: "AA",
          phase: "Clasificatoria",
          teamIds: ["team-a", "team-b"],
          suerteIds: ["cala", "piales"],
          date: "2026-07-27",
          startTime: "15:00",
          endTime: "17:00",
          venue: "Lienzo Norte",
          publicNotes: "Acceso desde las 14:00.",
          order: 1
        },
        {
          id: "charreada-charro",
          name: "Charro Completo Libre",
          competitionId: "competition-charro-libre",
          competitionType: "charro_completo",
          categoryId: "libre",
          phaseId: "final",
          individualParticipants: [{
            id: "participant-1",
            name: "Ana Charra",
            association: "Asociación Centro",
            category: "Libre",
            horseName: "Relámpago",
            order: 1
          }],
          order: 2
        },
        {
          id: "charreada-charro-juvenil",
          name: "Charro Completo Juvenil",
          competitionId: "competition-charro-juvenil",
          competitionType: "charro_completo",
          categoryId: "juvenil",
          phaseId: "final",
          individualParticipants: [{ id: "participant-2", name: "Luis Charro", order: 1 }],
          order: 3
        }
      ],
      scores: {
        raw_private: {
          teamId: "team-a",
          suerteId: "cala",
          total: 999,
          notes: "never public"
        }
      },
      publishedScores: {
        original: {
          id: "published-original",
          attemptKey: "team-a-cala",
          revision: 1,
          superseded: true,
          charreada: { id: "charreada-team" },
          competition: { id: "competition-team-aa", type: "equipos_completo" },
          team: { id: "team-a", name: "Equipo A" },
          suerte: { id: "cala" },
          total: 30,
          publishedAt: "2026-07-27T13:00:01.000Z"
        },
        correction: {
          id: "published-correction",
          attemptKey: "team-a-cala",
          revision: 2,
          correction: true,
          charreada: { id: "charreada-team" },
          competition: { id: "competition-team-aa", type: "equipos_completo" },
          team: { id: "team-a", name: "Equipo A" },
          suerte: { id: "cala" },
          attempt: { total: 35 },
          total: 280,
          breakdown: { total: 35 },
          publishedAt: "2026-07-27T13:00:02.000Z"
        },
        individual: {
          id: "published-individual",
          attemptKey: "participant-1-cala",
          revision: 1,
          charreada: { id: "charreada-charro" },
          competition: { id: "competition-charro-libre", type: "charro_completo" },
          team: { id: "participant-1", name: "Ana Charra", participantName: "Ana Charra", horseName: "Relámpago" },
          suerte: { id: "cala" },
          breakdown: { total: 42 },
          total: 42,
          publishedAt: "2026-07-27T13:00:03.000Z"
        },
        individualPaso: {
          id: "published-individual-paso",
          attemptKey: "participant-1-paso",
          revision: 1,
          charreada: { id: "charreada-charro" },
          competition: { id: "competition-charro-libre", type: "charro_completo" },
          team: { id: "participant-1", name: "Ana Charra", participantName: "Ana Charra", horseName: "Relámpago" },
          suerte: { id: "paso_de_la_muerte" },
          breakdown: { total: 24 },
          teamPenaltyTotal: -4,
          publishedAt: "2026-07-27T13:00:03.500Z"
        },
        juvenile: {
          id: "published-juvenile",
          attemptKey: "participant-2-piales",
          revision: 1,
          charreada: { id: "charreada-charro-juvenil" },
          competition: { id: "competition-charro-juvenil", type: "charro_completo" },
          team: { id: "participant-2", name: "Luis Charro", participantName: "Luis Charro" },
          suerte: { id: "piales" },
          breakdown: { total: 20 },
          total: 20,
          publishedAt: "2026-07-27T13:00:04.000Z"
        }
      }
    },
    liveCurrent: {
      charreada: { id: "charreada-team", name: "Equipos AA" },
      competitionId: "competition-team-aa",
      turn: {
        team: { id: "team-b", name: "Equipo B", association: "Asociación Sur", category: "AA" },
        suerte: { id: "cala", name: "Cala" }
      },
      notes: "private live note",
      pendingNote: "private pending note",
      broadcastState: { operatorId: "private" },
      timestamp: "2026-07-27T13:01:00.000Z"
    }
  };
}
