import assert from "node:assert/strict";
import { buildTournamentDeletionCallablePayload } from "../js/core/tournamentDeletionClient.js?v=20260831-official-ranking-authority-public-parity-compatibility-001-v1";
import deletionAuthority from "../functions/tournamentDeletionAuthority.js?v=20260831-official-ranking-authority-public-parity-compatibility-001-v1";

const formerPreflightPayload = {
  operation: "preflight",
  tournamentId: "tournament-nan-regression",
  expectedRevision: Number(undefined),
  idempotencyKey: ""
};
assert.throws(() => assertCallableSerializable(formerPreflightPayload), /non-finite-number:expectedRevision/);

const preflightPayload = buildTournamentDeletionCallablePayload("tournament-nan-regression", { operation: "preflight" });
assert.deepEqual(preflightPayload, {
  operation: "preflight",
  tournamentId: "tournament-nan-regression"
});
assert.doesNotThrow(() => assertCallableSerializable(preflightPayload));

const deletePayload = buildTournamentDeletionCallablePayload("tournament-nan-regression", {
  operation: "delete",
  expectedRevision: 4,
  idempotencyKey: "delete:tournament-nan-regression:request-0001"
});
assert.equal(deletePayload.expectedRevision, 4);
assert.doesNotThrow(() => assertCallableSerializable(deletePayload));

for (const value of [undefined, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
  assert.throws(() => buildTournamentDeletionCallablePayload("tournament-nan-regression", {
    operation: "delete",
    expectedRevision: value,
    idempotencyKey: "delete:tournament-nan-regression:request-0001"
  }), /tournament-delete-expected-revision-invalid/);
}

const malformedPreflight = deletionAuthority.buildTournamentDeletionPreflight({
  tournament: {
    info: { id: "tournament-nan-regression", name: "Revision no finita" },
    meta: { version: "NaN" }
  }
}, "tournament-nan-regression", { status: "precommercial", policyVersion: "1.0.0", sourceVersion: 1 });
assert.equal(malformedPreflight.revision, null);
assert.deepEqual(malformedPreflight.blockingReasons, ["tournament-delete-revision-invalid"]);
assert.doesNotThrow(() => assertCallableSerializable(malformedPreflight));

console.log("tournament delete NaN serialization recovery tests passed");

function assertCallableSerializable(value, path = "payload") {
  if (typeof value === "number" && !Number.isFinite(value)) {
    throw new Error(`non-finite-number:${path.split(".").at(-1)}`);
  }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) assertCallableSerializable(child, `${path}.${key}`);
}
