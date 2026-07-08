import { getTournamentSuertes } from "../data/suertes.js?v=20260708-tournament-types-001-pialadero1";
import { getTeamCharreadaResta, getTeamCharreadaTotal, getTeamSuerteTotal } from "./scoring.js?v=20260708-tournament-types-001-pialadero1";
import { getTeam, state } from "./state.js?v=20260708-tournament-types-001-pialadero1";

export function exportCurrentTournamentCsv(tournamentId) {
  const tournament = state.tournaments.find((item) => item.id === tournamentId);
  if (!tournament) return;
  const suertes = getTournamentSuertes(tournament, state.settings.globalRuleOverrides);
  const isIndividual = ["caladero", "coleadero", "pialadero"].includes(tournament.type);
  const tournamentCharreadas = state.charreadas.filter((charreada) => charreada.tournamentId === tournamentId);
  const showRestas = tournamentCharreadas.some((charreada) =>
    Object.values(charreada.restas || {}).some((value) => Number(value || 0) !== 0)
  );

  const rows = [
    [
      "Torneo",
      "Charreada",
      isIndividual ? "Participante" : "Equipo",
      ...suertes.map((suerte) => suerte.fullName),
      ...(showRestas ? ["Restas"] : []),
      "Total"
    ]
  ];

  tournamentCharreadas
    .forEach((charreada) => {
      charreada.teamIds.forEach((teamId) => {
        const team = getTeam(teamId);
	      rows.push([
	        tournament.name,
	        charreada.name,
	        formatEntryName(team),
          ...suertes.map((suerte) => getTeamSuerteTotal(charreada.id, teamId, suerte.id)),
          ...(showRestas ? [getTeamCharreadaResta(charreada.id, teamId)] : []),
          getTeamCharreadaTotal(charreada.id, teamId)
        ]);
      });
    });

  downloadText(`charropro-${slug(tournament.name)}.csv`, toCsv(rows), "text/csv;charset=utf-8");
}

function formatEntryName(team = {}) {
  const participantName = String(team?.participantName || "").trim();
  const horseName = String(team?.horseName || "").trim();
  if (participantName || horseName) return [participantName, horseName].filter(Boolean).join(" / ");
  return team?.name || "";
}

export function exportBackupJson() {
  downloadText(
    `charropro-respaldo-${new Date().toISOString().slice(0, 10)}.json`,
    JSON.stringify(state, null, 2),
    "application/json"
  );
}

function toCsv(rows) {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const value = String(cell ?? "");
          return `"${value.replaceAll('"', '""')}"`;
        })
        .join(",")
    )
    .join("\n");
}

function downloadText(filename, text, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function slug(value) {
  return String(value || "torneo")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
