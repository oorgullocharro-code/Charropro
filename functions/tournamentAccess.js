"use strict";

const GLOBAL_TOURNAMENT_ACCESS_ROLE = "supervisor";

function tournamentIdsForProfile(profile = {}) {
  const raw = Array.isArray(profile.tournamentIds)
    ? profile.tournamentIds
    : Object.values(profile.tournamentIds || {});
  return raw.map((id) => String(id || "").trim()).filter(Boolean);
}

function hasExplicitTournamentAccess(profile = {}, tournamentId = "", selectedAccess = false) {
  const role = String(profile.role || "").trim().toLowerCase();
  const mode = typeof profile.tournamentAccess === "string"
    ? profile.tournamentAccess.trim().toLowerCase()
    : "";
  const cleanTournamentId = String(tournamentId || "").trim();

  if (mode === "all") return role === GLOBAL_TOURNAMENT_ACCESS_ROLE;
  if (mode !== "selected" || !cleanTournamentId) return false;
  return selectedAccess === true || tournamentIdsForProfile(profile).includes(cleanTournamentId);
}

function normalizeTournamentAccessForWrite(value, role) {
  const mode = typeof value === "string" ? value.trim().toLowerCase() : "";
  const cleanRole = String(role || "").trim().toLowerCase();
  if (mode === "selected") return "selected";
  if (mode === "all" && cleanRole === GLOBAL_TOURNAMENT_ACCESS_ROLE) return "all";
  return "none";
}

module.exports = {
  GLOBAL_TOURNAMENT_ACCESS_ROLE,
  hasExplicitTournamentAccess,
  normalizeTournamentAccessForWrite,
  tournamentIdsForProfile
};
