import { buildCanonicalTournamentResults } from "./canonicalTournamentResults.js?v=20260911-coleadero-excel-export-valid-xlsx-and-colas-sheet-001-v1";
import { createXlsxBlob } from "./xlsx.js?v=20260911-coleadero-excel-export-valid-xlsx-and-colas-sheet-001-v1";
import { state } from "./state.js?v=20260911-coleadero-excel-export-valid-xlsx-and-colas-sheet-001-v1";

const COLEADERO_COMPETITION_ID = "coleadero";

export function isColeaderoXlsxExport({ tournament = {}, charreada = {} } = {}) {
  return String(tournament?.type || "").trim().toLowerCase() === COLEADERO_COMPETITION_ID &&
    String(charreada?.competitionId || charreada?.competitionType || "").trim().toLowerCase() === COLEADERO_COMPETITION_ID &&
    String(charreada?.competitionScope || "").trim().toLowerCase() === "individual";
}

export function buildColeaderoXlsxWorkbook(input = {}) {
  const source = normalizeSource(input);
  const tournament = source.tournament;
  const canonical = input.canonicalTournamentResults || buildCanonicalTournamentResults(source, {
    tournamentId: tournament.id,
    generatedAt: input.generatedAt
  });
  const charreadas = new Map(source.charreadas.map((charreada) => [charreada.id, charreada]));
  const competitions = (canonical.sheet?.competitions || [])
    .filter((competition) => isColeaderoXlsxExport({ tournament, charreada: charreadas.get(competition.charreadaId) }))
    .map((competition) => buildCompetitionRows(competition, charreadas.get(competition.charreadaId)))
    .sort(compareLots);

  if (!competitions.length) throw new Error("coleadero-xlsx-competition-not-found");
  if (competitions.length > 1 && competitions.some((competition) => competition.lotOrder === Number.MAX_SAFE_INTEGER)) {
    throw new Error("coleadero-xlsx-lot-order-missing");
  }
  const slots = uniqueSlotCount(competitions);
  if (!slots) throw new Error("coleadero-xlsx-opportunity-slots-missing");
  const headers = ["Lote", "Turno", "Participante", "Caballo", ...opportunityHeaders(slots), "Total"];
  const rows = [headers.map((value) => cell(value, "sectionTitle"))];
  for (const competition of competitions) {
    for (const row of competition.rows) {
      rows.push([
        cell(competition.lotName, "normal"),
        cell(row.turn, "number"),
        cell(row.participantName, "normal"),
        cell(row.horseName, "normal"),
        ...Array.from({ length: slots }, (_, index) => opportunityCell(row.opportunities, index + 1)),
        cell(row.total, "total")
      ]);
    }
  }

  return {
    generatedAt: input.generatedAt,
    sheets: [{
      name: "Colas",
      rows,
      merges: [],
      widths: [18, 10, 28, 24, ...Array.from({ length: slots }, () => 12), 14],
      freezeRows: 1,
      orientation: "landscape",
      fitToWidth: 1,
      fitToHeight: 1,
      showGridLines: true,
      margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 }
    }]
  };
}

export function createColeaderoXlsxBlob(input = {}) {
  return createXlsxBlob(buildColeaderoXlsxWorkbook(input));
}

export function downloadColeaderoXlsx(input = {}) {
  const workbook = buildColeaderoXlsxWorkbook(input);
  const blob = createXlsxBlob(workbook);
  const tournament = normalizeSource(input).tournament;
  const tournamentName = tournament.name || tournament.nombre || "coleadero";
  downloadBlob(`${slug(tournamentName)}-colas.xlsx`, blob);
}

function normalizeSource(input) {
  const sourceState = input.state || state;
  const requestedCharreadaId = String(input.charreadaId || sourceState.activeCharreadaId || "").trim();
  const charreada = (sourceState.charreadas || []).find((item) => item.id === requestedCharreadaId) || null;
  const tournamentId = String(input.tournamentId || charreada?.tournamentId || sourceState.activeTournamentId || "").trim();
  const tournament = (sourceState.tournaments || []).find((item) => item.id === tournamentId) || null;
  if (!tournament || !charreada || !isColeaderoXlsxExport({ tournament, charreada })) {
    throw new Error("coleadero-xlsx-context-invalid");
  }
  return {
    tournament,
    charreadas: (sourceState.charreadas || []).filter((item) => item.tournamentId === tournament.id),
    teams: (sourceState.teams || []).filter((item) => item.tournamentId === tournament.id),
    participants: (sourceState.participants || []).filter((item) => item.tournamentId === tournament.id),
    horses: (sourceState.horses || []).filter((item) => item.tournamentId === tournament.id),
    publishedScores: input.publishedScores || sourceState.publishedScores || [],
    officialScoreLedger: input.officialScoreLedger || sourceState.officialScoreLedger || {},
    sourceRevision: input.sourceRevision
  };
}

function buildCompetitionRows(competition, charreada) {
  const participantTurns = new Map((charreada?.participantIds || []).map((participantId, index) => [String(participantId), index + 1]));
  const rows = (competition.rows || []).map((row) => {
    const turn = participantTurns.get(String(row.participantId || ""));
    if (!Number.isSafeInteger(turn) || turn < 1) throw new Error("coleadero-xlsx-turn-missing");
    return {
      participantId: row.participantId,
      horseId: row.horseId,
      participantName: String(row.participantName || ""),
      horseName: String(row.horseName || ""),
      opportunities: Array.isArray(row.opportunities) ? row.opportunities : [],
      total: officialNumber(row.total, "coleadero-xlsx-total-invalid"),
      turn
    };
  }).sort((left, right) => left.turn - right.turn || String(left.participantId).localeCompare(String(right.participantId)));
  return {
    lotId: String(charreada?.id || competition.charreadaId || ""),
    lotName: String(charreada?.name || competition.charreadaName || competition.charreadaId || ""),
    lotOrder: programOrder(charreada),
    opportunitiesPerParticipant: positiveInteger(competition.opportunitiesPerParticipant),
    rows
  };
}

function compareLots(left, right) {
  return left.lotOrder - right.lotOrder || left.lotId.localeCompare(right.lotId);
}

function uniqueSlotCount(competitions) {
  const values = [...new Set(competitions.map((competition) => competition.opportunitiesPerParticipant).filter(Boolean))];
  if (values.length !== 1) throw new Error("coleadero-xlsx-opportunity-slots-inconsistent");
  return values[0];
}

function opportunityHeaders(slots) {
  return Array.from({ length: slots }, (_, index) => `${index + 1}ª`);
}

function opportunityCell(opportunities, opportunityNumber) {
  const opportunity = opportunities.find((item) => positiveInteger(item?.opportunityNumber) === opportunityNumber);
  return cell(opportunity ? officialNumber(opportunity.officialPoints, "coleadero-xlsx-opportunity-invalid") : "", "number");
}

function cell(value, style) {
  return { value, style };
}

function programOrder(charreada = {}) {
  const value = Number(charreada.order ?? charreada.orden ?? charreada.charreadaOrder ?? charreada.programOrder);
  return Number.isSafeInteger(value) && value > 0 ? value : Number.MAX_SAFE_INTEGER;
}

function positiveInteger(value) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : 0;
}

function officialNumber(value, errorCode) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(errorCode);
  return number;
}

function slug(value) {
  return String(value || "coleadero")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
