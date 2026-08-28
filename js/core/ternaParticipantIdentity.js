export const TERNA_PARTICIPANT_COUNT = 3;

export function buildTernaParticipantId(teamId, participantSlot) {
  const safeTeamId = String(teamId || "team")
    .trim()
    .replace(/[^A-Za-z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "") || "team";
  const slot = normalizeTernaParticipantSlot(participantSlot);
  return slot ? `terna_${safeTeamId}_slot_${slot}` : "";
}

export function normalizeTernaParticipant(value, options = {}) {
  const participantSlot = normalizeTernaParticipantSlot(options.participantSlot ?? value?.participantSlot);
  const source = value && typeof value === "object" ? value : {};
  const participantName = String(
    source.participantName || source.name || (typeof value === "string" ? value : "")
  ).trim();
  const participantId = String(
    source.participantId || source.id || buildTernaParticipantId(options.teamId, participantSlot)
  ).trim();
  return { participantId, participantSlot, participantName };
}

export function getCanonicalTernaRoster(team = {}) {
  const roster = team?.roster || {};
  const values = Array.isArray(roster.terna) ? roster.terna : [];
  const aliases = [roster.lazo, roster.pial_ruedo, roster.terna_auxiliar];
  return Array.from({ length: TERNA_PARTICIPANT_COUNT }, (_, index) => {
    const participant = normalizeTernaParticipant(values[index] ?? aliases[index] ?? "", {
      teamId: team?.id,
      participantSlot: index + 1
    });
    return participant.participantName || !getTernaParticipantName(aliases[index])
      ? participant
      : { ...participant, participantName: getTernaParticipantName(aliases[index]) };
  });
}

export function buildCanonicalTernaRoster(teamId, participantNames = [], existingRoster = []) {
  const existing = Array.isArray(existingRoster) ? existingRoster : [];
  return Array.from({ length: TERNA_PARTICIPANT_COUNT }, (_, index) => {
    const participantSlot = index + 1;
    const previous = normalizeTernaParticipant(existing[index], { teamId, participantSlot });
    const participantName = String(participantNames[index] || "").trim();
    return {
      participantId: previous.participantId || buildTernaParticipantId(teamId, participantSlot),
      participantSlot,
      participantName
    };
  });
}

export function getTernaParticipant(team = {}, zeroBasedIndex = 0) {
  const index = Math.max(0, Math.min(TERNA_PARTICIPANT_COUNT - 1, Number(zeroBasedIndex) || 0));
  return getCanonicalTernaRoster(team)[index];
}

export function getTernaParticipantName(value) {
  return String(
    value && typeof value === "object"
      ? value.participantName || value.name || ""
      : value || ""
  ).trim();
}

export function isCanonicalTernaParticipant(value = {}) {
  return Boolean(
    String(value.participantId || "").trim()
    && normalizeTernaParticipantSlot(value.participantSlot)
    && String(value.participantName || "").trim()
  );
}

function normalizeTernaParticipantSlot(value) {
  const slot = Number(value);
  return Number.isInteger(slot) && slot >= 1 && slot <= TERNA_PARTICIPANT_COUNT ? slot : 0;
}
