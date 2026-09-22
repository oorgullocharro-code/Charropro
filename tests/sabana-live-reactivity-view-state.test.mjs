import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import test from "node:test";
import {
  getCanonicalOfficialSuerteTotals,
  getCanonicalOfficialTeamTotals
} from "../js/core/canonicalOfficialResults.js?v=20260920-public-sabana-phase-title-ux-deploy-001-v1";

const appSource = await readFile(new URL("../js/app.js", import.meta.url), "utf8");
const canonicalHelpers = loadCanonicalHelpers(appSource);
const tournamentId = "tournament-live-sabana";
const charreadaId = "charreada-phase-two";
const teamId = "team-phase-two";

test("draft score listener cannot destructively render Results before canonical authority arrives", () => {
  const renderGate = functionSource(appSource, "shouldRenderForRemoteScores");
  assert.doesNotMatch(renderGate, /"results"/);
  assert.match(appSource, /if \(localView === "results" && canonicalOfficialUpdate\.newer && refreshResultsLiveRegion\(\)\)/);
});

test("a canonical official update is accepted despite a non-causal timestamp and advances the Sabana cell", () => {
  const before = authority([], {});
  const incomingRecord = official("official-27", 27, 1);
  const incoming = authority([incomingRecord], ledger(incomingRecord));
  const update = canonicalHelpers.getCanonicalOfficialStateUpdate(tournamentId, incoming, before);
  assert.equal(JSON.stringify(update), JSON.stringify({ changed: true, newer: true, stale: false }));
  assert.equal(cellTotal(incoming.publishedScores, incoming.officialScoreLedger), 27);
});

test("a second canonical official update remains newer without changing the phase authority", () => {
  const first = official("official-27", 27, 1);
  const second = official("official-42", 42, 2);
  const update = canonicalHelpers.getCanonicalOfficialStateUpdate(
    tournamentId,
    authority([first, second], ledger(second)),
    authority([first], ledger(first))
  );
  assert.equal(JSON.stringify(update), JSON.stringify({ changed: true, newer: true, stale: false }));
  assert.equal(cellTotal([first, second], ledger(second)), 42);
  assert.match(appSource, /state\.resultsPhaseFilter/);
});

test("zero remains official while absence remains pending through the canonical refresh contract", () => {
  const zero = official("official-zero", 0, 1);
  assert.equal(cellTotal([zero], ledger(zero)), 0);
  assert.equal(cellTotal([], {}), null);
});

test("a genuinely older canonical snapshot cannot overwrite a later official record", () => {
  const older = official("official-27", 27, 1);
  const later = official("official-42", 42, 2);
  const update = canonicalHelpers.getCanonicalOfficialStateUpdate(
    tournamentId,
    authority([older], ledger(older)),
    authority([older, later], ledger(later))
  );
  assert.equal(JSON.stringify(update), JSON.stringify({ changed: true, newer: false, stale: true }));
});

test("localized Results refresh preserves modeled phase and both relevant scroll positions", () => {
  const refresh = functionSource(appSource, "refreshResultsLiveRegion");
  assert.match(appSource, /data-results-live-region/);
  assert.match(refresh, /const scrollTop = main\.scrollTop/);
  assert.match(refresh, /main\.scrollTop = scrollTop/);
  assert.match(refresh, /table\.scrollLeft = previous\.left/);
  assert.match(refresh, /region\.innerHTML = renderResultsContent\(\)/);
  assert.doesNotMatch(refresh, /app\.innerHTML/);
  assert.match(appSource, /state\.resultsPhaseFilter/);
});

function authority(records, officialScoreLedger) {
  return { publishedScores: records, officialScoreLedger };
}

function ledger(record) {
  return {
    "attempt-phase-two": {
      revision: record.revision,
      activeRecordId: record.id,
      updatedAtMs: record.timestampMs
    }
  };
}

function official(id, total, revision) {
  return {
    id,
    revision,
    status: "active",
    officialStatus: "active",
    timestampMs: revision,
    tournamentId,
    charreadaId,
    teamId,
    suerteId: "cala",
    breakdown: {
      attemptV2: {
        identity: { tournamentId, charreadaId, teamId, suerteId: "cala" },
        scoring: { teamAdjustedPoints: total }
      }
    }
  };
}

function cellTotal(records, officialScoreLedger) {
  const totals = getCanonicalOfficialTeamTotals({ publishedScores: records, officialScoreLedger }, { tournamentId, charreadaId, teamId });
  const officialTotal = getCanonicalOfficialSuerteTotals(totals, "cala");
  return officialTotal.hasOfficialResult ? officialTotal.total : null;
}

function loadCanonicalHelpers(source) {
  const names = [
    "getCanonicalOfficialStateUpdate",
    "buildCanonicalOfficialState",
    "canonicalOfficialRecordStamp",
    "canonicalOfficialLedgerStamp",
    "isCanonicalOfficialStateOlder"
  ];
  const script = `${names.map((name) => functionSource(source, name)).join("\n")}\nglobalThis.helpers = { ${names.join(", ")} };`;
  const context = vm.createContext({ JSON, Object, Array, Number });
  new vm.Script(script).runInContext(context);
  return context.helpers;
}

function functionSource(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} must exist`);
  const parametersStart = source.indexOf("(", start);
  const parametersEnd = matchingIndex(source, parametersStart, "(", ")");
  const braceStart = source.indexOf("{", parametersEnd);
  let depth = 0;
  for (let index = braceStart; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") depth -= 1;
    if (depth === 0) return source.slice(start, index + 1);
  }
  throw new Error(`${name} source is incomplete`);
}

function matchingIndex(source, start, open, close) {
  let depth = 0;
  for (let index = start; index < source.length; index += 1) {
    if (source[index] === open) depth += 1;
    if (source[index] === close) depth -= 1;
    if (depth === 0) return index;
  }
  throw new Error("unclosed function parameters");
}
