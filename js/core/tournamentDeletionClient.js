const TOURNAMENT_ID_PATTERN = /^[A-Za-z0-9_-]{1,180}$/;
const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9._:@/-]{12,180}$/;

export function buildTournamentDeletionCallablePayload(tournamentIdInput, actor = {}) {
  const tournamentId = String(tournamentIdInput || "").trim();
  if (!TOURNAMENT_ID_PATTERN.test(tournamentId)) throw new Error("tournament-delete-tournament-invalid");
  const operation = String(actor.operation || "delete").trim().toLowerCase();
  if (operation === "preflight") return { operation, tournamentId };
  if (operation !== "delete") throw new Error("tournament-delete-operation-invalid");

  const expectedRevision = Number(actor.expectedRevision);
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0) {
    throw new Error("tournament-delete-expected-revision-invalid");
  }
  const idempotencyKey = String(actor.idempotencyKey || "").trim();
  if (!IDEMPOTENCY_KEY_PATTERN.test(idempotencyKey)) {
    throw new Error("tournament-delete-idempotency-invalid");
  }
  return { operation, tournamentId, expectedRevision, idempotencyKey };
}
