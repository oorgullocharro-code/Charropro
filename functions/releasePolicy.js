"use strict";

const RELEASE_STATUSES = Object.freeze({
  PRECOMMERCIAL: "precommercial",
  COMMERCIAL_APPROVED: "commercial_approved"
});

const TOURNAMENT_DATA_CLASSIFICATIONS = Object.freeze({
  TEST: "TEST",
  OFFICIAL: "OFFICIAL"
});

function resolveGlobalReleaseAuthority(configuration = {}) {
  const status = String(configuration?.values?.system?.releaseStatus || "").trim().toLowerCase();
  if (!Object.values(RELEASE_STATUSES).includes(status)) throw new Error("release-status-invalid");
  return Object.freeze({
    status,
    policyVersion: "1.0.0",
    sourceVersion: Number(configuration?.sources?.find((source) => source.scope === "system")?.version || 1),
    sourceChecksum: String(configuration?.sources?.find((source) => source.scope === "system")?.checksum || configuration?.checksum || "")
  });
}

function resolveTournamentDataClassification(tournament = {}, releaseAuthority = {}) {
  const releaseStatus = String(releaseAuthority.status || "").toLowerCase();
  if (!Object.values(RELEASE_STATUSES).includes(releaseStatus)) throw new Error("release-status-invalid");
  if (releaseStatus === RELEASE_STATUSES.PRECOMMERCIAL) {
    return Object.freeze({
      classification: TOURNAMENT_DATA_CLASSIFICATIONS.TEST,
      source: "precommercial-default"
    });
  }
  const explicit = String(tournament?.info?.dataClassification || tournament?.dataClassification || "").trim().toUpperCase();
  if (explicit === TOURNAMENT_DATA_CLASSIFICATIONS.OFFICIAL) {
    return Object.freeze({ classification: explicit, source: "explicit" });
  }
  if (explicit === TOURNAMENT_DATA_CLASSIFICATIONS.TEST) {
    return Object.freeze({ classification: explicit, source: "explicit" });
  }
  return Object.freeze({
    classification: TOURNAMENT_DATA_CLASSIFICATIONS.TEST,
    source: "legacy-precommercial"
  });
}

function canHardDeleteTournament(releaseAuthority = {}, classification = "", hasOfficialHistory = false) {
  if (releaseAuthority.status === RELEASE_STATUSES.PRECOMMERCIAL) return true;
  return !(classification === TOURNAMENT_DATA_CLASSIFICATIONS.OFFICIAL && hasOfficialHistory === true);
}

module.exports = {
  RELEASE_STATUSES,
  TOURNAMENT_DATA_CLASSIFICATIONS,
  canHardDeleteTournament,
  resolveGlobalReleaseAuthority,
  resolveTournamentDataClassification
};
