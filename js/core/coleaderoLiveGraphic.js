import { getCanonicalOfficialTeamTotals, getOfficialRecordValue } from "./canonicalOfficialResults.js?v=20260912-portal-v2-home-visual-composition-002-v1";
import { resolveTournamentRules } from "../data/suertes.js?v=20260912-portal-v2-home-visual-composition-002-v1";

export const COLEADERO_LIVE_WINDOW_SIZE = 5;

export function isIndividualColeaderoLiveContext(charreada = {}, context = {}) {
  const scope = String(
    context?.competitionContext?.competitionScope
    || charreada?.competitionScope
    || context?.competitionScope
    || ""
  ).toLowerCase();
  const competitionId = String(
    charreada?.competitionId
    || charreada?.competitionType
    || context?.competitionContext?.competitionId
    || ""
  ).toLowerCase();
  return scope === "individual" && competitionId === "coleadero";
}

export function resolveColeaderoLiveOpportunitySlots(tournament = {}) {
  const resolution = resolveTournamentRules(tournament);
  if (!resolution.valid || resolution.blocked || !resolution.profile?.profileId) return 0;
  const colas = (resolution.suertes || []).find((suerte) => suerte?.id === "colas");
  const slots = Number(colas?.ruleMetadata?.opportunitiesPerParticipant);
  return Number.isSafeInteger(slots) && slots > 0 ? slots : 0;
}

export function selectColeaderoFiveRiderWindow(rows = [], currentParticipantId = "", windowSize = COLEADERO_LIVE_WINDOW_SIZE) {
  const orderedRows = Array.isArray(rows) ? rows.slice() : [];
  const size = Number.isSafeInteger(windowSize) && windowSize > 0 ? windowSize : COLEADERO_LIVE_WINDOW_SIZE;
  if (orderedRows.length <= size) return orderedRows;

  const currentIndex = orderedRows.findIndex((row) => row?.participantId === currentParticipantId);
  if (currentIndex < 0) return orderedRows.slice(0, size);

  const before = Math.floor(size / 2);
  const start = Math.max(0, Math.min(currentIndex - before, orderedRows.length - size));
  return orderedRows.slice(start, start + size);
}

export function buildIndividualColeaderoLiveData({
  tournament = {},
  charreada = {},
  entries = [],
  currentParticipantId = "",
  canonicalOfficialResults = { currentRecords: [] }
} = {}) {
  const opportunitiesPerParticipant = resolveColeaderoLiveOpportunitySlots(tournament);
  const sourceRows = (Array.isArray(entries) ? entries : []).map((entry, index) => buildParticipantRow({
    entry,
    turn: index + 1,
    tournamentId: tournament?.id || "",
    charreadaId: charreada?.id || "",
    opportunitiesPerParticipant,
    currentParticipantId,
    currentRecords: canonicalOfficialResults?.currentRecords || []
  }));
  const currentIndex = sourceRows.findIndex((row) => row.participantId === currentParticipantId);

  return {
    participantScope: "individual",
    charreada: {
      id: String(charreada?.id || ""),
      name: String(charreada?.name || "")
    },
    suerte: {
      id: "colas",
      name: "Colas",
      fullName: "Coleadero"
    },
    currentParticipantId: String(currentParticipantId || ""),
    currentIndex,
    participantCount: sourceRows.length,
    opportunitiesPerParticipant,
    rows: selectColeaderoFiveRiderWindow(sourceRows, currentParticipantId)
  };
}

function buildParticipantRow({ entry = {}, turn, tournamentId, charreadaId, opportunitiesPerParticipant, currentParticipantId, currentRecords }) {
  const participantId = String(entry?.id || "");
  const records = currentRecords.filter((record) => isOfficialColeaderoRecordForParticipant(record, {
    tournamentId,
    charreadaId,
    participantId
  }));
  const opportunitiesByNumber = new Map();
  records.forEach((record) => {
    const opportunity = officialOpportunity(record);
    if (opportunity && !opportunitiesByNumber.has(opportunity.opportunityNumber)) {
      opportunitiesByNumber.set(opportunity.opportunityNumber, opportunity);
    }
  });
  const totals = getCanonicalOfficialTeamTotals({ currentRecords }, {
    tournamentId,
    charreadaId,
    participantId
  });

  return {
    participantId,
    participantName: String(entry?.participantName || ""),
    horseId: String(entry?.horseId || ""),
    horseName: String(entry?.horseName || ""),
    turn,
    active: participantId === currentParticipantId,
    opportunities: [...opportunitiesByNumber.values()]
      .filter((item) => !opportunitiesPerParticipant || item.opportunityNumber <= opportunitiesPerParticipant)
      .sort((left, right) => left.opportunityNumber - right.opportunityNumber),
    officialTotal: Number(totals.suerteTotals?.colas || 0)
  };
}

function isOfficialColeaderoRecordForParticipant(record = {}, scope = {}) {
  const identity = record?.breakdown?.attemptV2?.identity || {};
  const tournamentId = String(record?.tournament?.id || record?.tournamentId || identity.tournamentId || "");
  const charreadaId = String(record?.charreada?.id || record?.charreadaId || identity.charreadaId || "");
  const participantId = String(record?.participant?.id || record?.participantId || identity.participantId || record?.team?.id || record?.teamId || identity.teamId || "");
  const suerteId = String(record?.suerte?.id || record?.suerteId || identity.suerteId || "");
  const participantScope = String(record?.participantScope || record?.competition?.scope || record?.competition?.competitionScope || identity.participantScope || "").toLowerCase();
  return tournamentId === scope.tournamentId
    && charreadaId === scope.charreadaId
    && participantId === scope.participantId
    && suerteId === "colas"
    && participantScope === "individual";
}

function officialOpportunity(record = {}) {
  const identity = record?.breakdown?.attemptV2?.identity || {};
  const sportState = record?.breakdown?.attemptV2?.sportState || {};
  const opportunityNumber = Number(identity.opportunityNumber || sportState?.opportunity?.number || 0);
  if (!Number.isSafeInteger(opportunityNumber) || opportunityNumber < 1) return null;
  return {
    opportunityNumber,
    officialPoints: getOfficialRecordValue(record),
    status: String(sportState.status || record.officialStatus || record.status || "OFFICIAL").toUpperCase()
  };
}
