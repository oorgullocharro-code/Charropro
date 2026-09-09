const LIFECYCLE = Object.freeze({
  PRE_EVENT: "PRE_EVENT",
  LIVE: "LIVE",
  PAUSED: "PAUSED",
  FINALIZED: "FINALIZED",
  ARCHIVED: "ARCHIVED"
});

const ARCHIVED = new Set(["ARCHIVED", "ARCHIVADO"]);
const FINALIZED = new Set(["FINAL", "FINALIZED", "COMPLETED", "CLOSED", "FINISHED", "TERMINADO", "FINALIZADO", "CONGELADO"]);
const PAUSED = new Set(["PAUSED", "PAUSA", "PAUSADO"]);
const LIVE = new Set(["LIVE", "RUNNING", "EN_VIVO", "EN VIVO", "ACTIVO"]);

// This is a lifecycle transport authority, not a sporting-state calculation.
// A live charreada must be represented by a source identity that exists in the
// tournament program; arbitrary IDs never promote a tournament to LIVE.
export function resolveCanonicalTournamentLifecycle({ tournament = {}, liveCurrent = {} } = {}) {
  const info = object(tournament.info || tournament);
  const explicitStatuses = [
    liveCurrent.lifecycleStatus,
    liveCurrent.status,
    info.lifecycleStatus,
    info.status,
    info.estado,
    tournament.lifecycleStatus,
    tournament.status
  ].map(normalizeStatus);

  if (explicitStatuses.some((status) => ARCHIVED.has(status))) return resolution(LIFECYCLE.ARCHIVED, "explicit-archived");
  if (explicitStatuses.some((status) => FINALIZED.has(status))) return resolution(LIFECYCLE.FINALIZED, "explicit-finalized");
  if (explicitStatuses.some((status) => PAUSED.has(status))) return resolution(LIFECYCLE.PAUSED, "explicit-paused");
  if (explicitStatuses.some((status) => LIVE.has(status))) return resolution(LIFECYCLE.LIVE, "explicit-live");

  const charreadas = collection(tournament.charreadas);
  const activeCharreadaId = firstId(
    liveCurrent.activeCharreadaId,
    liveCurrent.charreadaId,
    liveCurrent.charreada?.id,
    liveCurrent.turn?.charreadaId
  );
  if (activeCharreadaId && charreadas.some((charreada) => id(charreada.id || charreada.charreadaId) === activeCharreadaId)) {
    return resolution(LIFECYCLE.LIVE, "live-current-active-charreada");
  }

  if (charreadas.some((charreada) => LIVE.has(normalizeStatus(charreada.status || charreada.estado)))) {
    return resolution(LIFECYCLE.LIVE, "program-active-charreada");
  }

  return resolution(LIFECYCLE.PRE_EVENT, "no-authoritative-live-state");
}

export const CANONICAL_TOURNAMENT_LIFECYCLE = LIFECYCLE;

function resolution(status, source) {
  return Object.freeze({ status, source });
}

function object(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function collection(value) {
  return Array.isArray(value) ? value.filter(Boolean) : value && typeof value === "object" ? Object.values(value).filter(Boolean) : [];
}

function id(value) {
  const clean = String(value || "").trim();
  return /^[A-Za-z0-9._:@/-]{1,180}$/.test(clean) ? clean : "";
}

function firstId(...values) {
  for (const value of values) {
    const resolved = id(value);
    if (resolved) return resolved;
  }
  return "";
}

function normalizeStatus(value) {
  return String(value || "").trim().toUpperCase();
}
