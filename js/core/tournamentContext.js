let tournamentContext = {
  tournamentId: "",
  source: ""
};

export function getTournamentIdFromUrl(search = window.location.search) {
  const params = new URLSearchParams(search || "");
  return normalizeTournamentId(
    params.get("id") ||
      params.get("tournamentId") ||
      params.get("torneo") ||
      params.get("tournament") ||
      params.get("canal") ||
      params.get("channel")
  );
}

export function requireTournamentId(search = window.location.search) {
  const tournamentId = getTournamentIdFromUrl(search);
  if (!tournamentId) throw new Error("Falta el ID del torneo en la URL.");
  return tournamentId;
}

export function setTournamentContext(id, source = "manual") {
  tournamentContext = {
    tournamentId: normalizeTournamentId(id),
    source
  };
  return tournamentContext;
}

export function getTournamentContext() {
  return { ...tournamentContext };
}

export function clearTournamentContext() {
  tournamentContext = {
    tournamentId: "",
    source: ""
  };
}

export function buildTournamentUrl(fileName, tournamentId, extraParams = {}) {
  const params = new URLSearchParams();
  params.set("tournamentId", normalizeTournamentId(tournamentId));
  Object.entries(extraParams || {}).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") return;
    params.set(key, String(value));
  });
  return `./${fileName}?${params.toString()}`;
}

function normalizeTournamentId(value) {
  return String(value || "").trim();
}
