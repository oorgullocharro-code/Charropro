import { buildCanonicalTournamentResults } from "./canonicalTournamentResults.js?v=20260911-portal-v2-premium-public-design-foundation-and-home-001-v1";
import {
  buildCanonicalOfficialResults,
  getCanonicalSportingOpportunityKey
} from "./canonicalOfficialResults.js?v=20260911-portal-v2-premium-public-design-foundation-and-home-001-v1";
import { createXlsxBlob } from "./xlsx.js?v=20260911-portal-v2-premium-public-design-foundation-and-home-001-v1";
import { state } from "./state.js?v=20260911-portal-v2-premium-public-design-foundation-and-home-001-v1";

const COLEADERO_COMPETITION_ID = "coleadero";

export function isColeaderoXlsxExport({ tournament = {}, charreada = {} } = {}) {
  return String(tournament?.type || "").trim().toLowerCase() === COLEADERO_COMPETITION_ID &&
    String(charreada?.competitionId || charreada?.competitionType || "").trim().toLowerCase() === COLEADERO_COMPETITION_ID &&
    String(charreada?.competitionScope || "").trim().toLowerCase() === "individual";
}

export function buildColeaderoXlsxWorkbook(input = {}) {
  const source = normalizeSource(input);
  const tournament = source.tournament;
  const officialOpportunityValues = buildOfficialColeaderoOpportunityValues(source, tournament.id);
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
  const rows = buildHeaders(slots);
  for (const competition of competitions) {
    for (const row of competition.rows) {
      rows.push([
        cell(competition.lotName, "normal"),
        cell(row.turn, "number"),
        cell(row.participantName, "normal"),
        cell(row.horseName, "normal"),
        ...Array.from({ length: slots }, (_, index) => opportunityCells({
          tournamentId: tournament.id,
          competitionId: competition.competitionId,
          charreadaId: competition.lotId,
          participantId: row.participantId,
          opportunities: row.opportunities,
          opportunityNumber: index + 1,
          officialOpportunityValues
        })).flat(),
        cell(row.total, "total")
      ]);
    }
  }

  return {
    generatedAt: input.generatedAt,
    sheets: [{
      name: "Colas",
      rows,
      merges: headerMerges(slots),
      widths: [18, 10, 28, 24, ...Array.from({ length: slots }, () => [10, 10, 10]).flat(), 14],
      freezeRows: 2,
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
    competitionId: String(competition.competitionId || charreada?.competitionId || COLEADERO_COMPETITION_ID),
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

function buildHeaders(slots) {
  const title = [
    cell("COLEADERO", "groupHeader"), cell("", "groupHeader"), cell("", "groupHeader"), cell("", "groupHeader")
  ];
  const columns = [
    cell("Lote", "compactColumnHeader"),
    cell("Turno", "compactColumnHeader"),
    cell("Participante", "compactColumnHeader"),
    cell("Caballo", "compactColumnHeader")
  ];
  for (let index = 1; index <= slots; index += 1) {
    title.push(cell(opportunityTitle(index), "groupHeader"), cell("", "groupHeader"), cell("", "groupHeader"));
    columns.push(cell("BUENOS", "compactColumnHeader"), cell("MALOS", "badHeader"), cell("TOTAL", "compactColumnHeader"));
  }
  title.push(cell("TOTAL", "groupHeader"));
  columns.push(cell("", "compactColumnHeader"));
  return [title, columns];
}

function headerMerges(slots) {
  const merges = ["A1:D1"];
  for (let index = 0; index < slots; index += 1) {
    const firstColumn = 5 + index * 3;
    merges.push(`${columnName(firstColumn)}1:${columnName(firstColumn + 2)}1`);
  }
  const totalColumn = 5 + slots * 3;
  merges.push(`${columnName(totalColumn)}1:${columnName(totalColumn)}2`);
  return merges;
}

function opportunityTitle(index) {
  const ordinal = index === 1 ? "1er" : index === 2 ? "2do" : `${index}er`;
  return `${ordinal} PASADA`;
}

function opportunityCells({ tournamentId, competitionId, charreadaId, participantId, opportunities, opportunityNumber, officialOpportunityValues }) {
  const opportunity = opportunities.find((item) => positiveInteger(item?.opportunityNumber) === opportunityNumber);
  if (!opportunity) return [cell("", "number"), cell("", "badScoreCell"), cell("", "number")];
  const canonicalTotal = officialNumber(opportunity.officialPoints, "coleadero-xlsx-opportunity-invalid");
  const key = coleaderoOpportunityKey({ tournamentId, competitionId, charreadaId, participantId, opportunityNumber });
  const values = officialOpportunityValues.get(key);
  if (!values) throw new Error("coleadero-xlsx-official-opportunity-missing");
  if (values.invalid) throw new Error(values.invalid);
  if (values.officialPoints !== canonicalTotal) throw new Error("coleadero-xlsx-official-opportunity-mismatch");
  return [
    cell(values.goodPoints, "number"),
    cell(values.individualBadPoints, "badScoreCell"),
    cell(values.officialPoints, "number")
  ];
}

function buildOfficialColeaderoOpportunityValues(source, tournamentId) {
  const official = buildCanonicalOfficialResults({
    publishedScores: source.publishedScores,
    officialScoreLedger: source.officialScoreLedger,
    tournamentId
  });
  const values = new Map();
  for (const record of official.currentRecords) {
    const identity = record?.breakdown?.attemptV2?.identity || {};
    const competitionScope = String(
      record?.competition?.scope ||
      record?.competition?.competitionScope ||
      record?.participantScope ||
      record?.breakdown?.attemptV2?.context?.competitionScope ||
      ""
    ).toLowerCase();
    const suerteId = String(record?.suerte?.id || record?.suerteId || identity.suerteId || "").toLowerCase();
    if (competitionScope !== "individual" || suerteId !== "colas") continue;
    const key = getCanonicalSportingOpportunityKey(record, { tournamentId });
    if (key) values.set(key, extractFrozenOpportunityValues(record));
  }
  return values;
}

function extractFrozenOpportunityValues(record) {
  const attemptV2 = record?.breakdown?.attemptV2 || {};
  const scoring = attemptV2.scoring || {};
  if (attemptV2.publication?.state !== "OFFICIAL" || attemptV2.publication?.frozen !== true) {
    return { invalid: "coleadero-xlsx-official-attempt-not-frozen" };
  }
  const values = {
    goodPoints: finiteOfficialNumber(scoring.goodPoints),
    individualBadPoints: finiteOfficialNumber(scoring.individualBadPoints),
    officialPoints: finiteOfficialNumber(scoring.teamAdjustedPoints)
  };
  return Object.values(values).every((value) => value !== null)
    ? values
    : { invalid: "coleadero-xlsx-official-opportunity-values-invalid" };
}

function coleaderoOpportunityKey({ tournamentId, competitionId, charreadaId, participantId, opportunityNumber }) {
  return getCanonicalSportingOpportunityKey({
    tournament: { id: tournamentId },
    charreada: { id: charreadaId, competitionId },
    competition: { id: competitionId, scope: "individual" },
    participant: { id: participantId },
    participantScope: "individual",
    suerte: { id: "colas", type: COLEADERO_COMPETITION_ID },
    breakdown: {
      attemptV2: {
        identity: { tournamentId, charreadaId, competitionId, participantId, suerteId: "colas", opportunityNumber },
        sportState: { opportunity: { number: opportunityNumber } }
      }
    }
  }, { tournamentId });
}

function finiteOfficialNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
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

function columnName(columnNumber) {
  let name = "";
  let current = columnNumber;
  while (current > 0) {
    const remainder = (current - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    current = Math.floor((current - 1) / 26);
  }
  return name;
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
