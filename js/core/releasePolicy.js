import {
  getBootstrapConfigurationValue,
  loadConfigurationBootstrap
} from "./configurationBootstrap.js";

export const RELEASE_STATUSES = Object.freeze({
  PRECOMMERCIAL: "precommercial",
  COMMERCIAL_APPROVED: "commercial_approved"
});

export const TOURNAMENT_DATA_CLASSIFICATIONS = Object.freeze({
  TEST: "TEST",
  OFFICIAL: "OFFICIAL"
});

const baseline = await loadConfigurationBootstrap();

export function resolveClientReleaseStatus(configuration = baseline) {
  const status = String(
    configuration?.globalReleaseAuthority?.status
    || getBootstrapConfigurationValue(configuration, "system.releaseStatus", "")
  ).trim().toLowerCase();
  if (!Object.values(RELEASE_STATUSES).includes(status)) throw new Error("release-status-invalid");
  return status;
}

export function applyReleaseClassificationToNewTournament(tournament = {}, configuration = baseline, options = {}) {
  const releaseStatus = resolveClientReleaseStatus(configuration);
  const createdAt = new Date(options.now || Date.now()).toISOString();
  return {
    ...tournament,
    dataClassification: releaseStatus === RELEASE_STATUSES.COMMERCIAL_APPROVED
      ? TOURNAMENT_DATA_CLASSIFICATIONS.OFFICIAL
      : TOURNAMENT_DATA_CLASSIFICATIONS.TEST,
    releaseStatusAtCreation: releaseStatus,
    createdAt
  };
}
