export const TEAM_LINEUP_POSITIONS = Object.freeze([
  Object.freeze({ id: "cala", label: "Cala de Caballo", suerteIds: ["cala"], fieldName: "roster.cala" }),
  Object.freeze({ id: "piales", label: "Piales en el Lienzo", suerteIds: ["piales"], fieldName: "roster.piales" }),
  Object.freeze({ id: "colas-1", label: "Coleador 1", suerteIds: ["colas"], fieldName: "roster.colas.0", rosterKey: "colas", rosterIndex: 0 }),
  Object.freeze({ id: "colas-2", label: "Coleador 2", suerteIds: ["colas"], fieldName: "roster.colas.1", rosterKey: "colas", rosterIndex: 1 }),
  Object.freeze({ id: "colas-3", label: "Coleador 3", suerteIds: ["colas"], fieldName: "roster.colas.2", rosterKey: "colas", rosterIndex: 2 }),
  Object.freeze({ id: "toro", label: "Jinete de Toro", suerteIds: ["toro"], fieldName: "roster.toro" }),
  Object.freeze({ id: "terna-1", label: "Terna 1 - Lazo a la cabeza", suerteIds: ["lazo", "pial_ruedo"], fieldName: "roster.terna.0", rosterKey: "terna", rosterIndex: 0 }),
  Object.freeze({ id: "terna-2", label: "Terna 2 - Pial en el ruedo", suerteIds: ["lazo", "pial_ruedo"], fieldName: "roster.terna.1", rosterKey: "terna", rosterIndex: 1 }),
  Object.freeze({ id: "terna-3", label: "Terna 3 - Apoyo", suerteIds: ["lazo", "pial_ruedo"], fieldName: "roster.terna.2", rosterKey: "terna", rosterIndex: 2 }),
  Object.freeze({ id: "yegua", label: "Jinete de Yegua", suerteIds: ["yegua"], fieldName: "roster.yegua" }),
  Object.freeze({ id: "manganas-pie", label: "Manganas a Pie", suerteIds: ["manganas_pie"], fieldName: "roster.manganas_pie", rosterKey: "manganas_pie" }),
  Object.freeze({ id: "manganas-caballo", label: "Manganas a Caballo", suerteIds: ["manganas_caballo"], fieldName: "roster.manganas_caballo", rosterKey: "manganas_caballo" }),
  Object.freeze({ id: "paso", label: "Paso de la Muerte", suerteIds: ["paso"], fieldName: "roster.paso" })
]);

const KNOWN_ROSTER_KEYS = new Set([
  "cala", "piales", "colas", "toro", "lazo", "pial_ruedo", "terna", "terna_auxiliar", "yegua", "manganas_pie", "manganas_caballo", "paso"
]);

export function resolveTeamLineupEntries(roster = {}, suerteIds = []) {
  const availableSuertes = new Set(Array.isArray(suerteIds) ? suerteIds.map((value) => String(value || "")) : []);
  const canonical = TEAM_LINEUP_POSITIONS.filter((position) => position.suerteIds.some((id) => availableSuertes.has(id)));
  const legacy = Object.keys(asRecord(roster))
    .filter((key) => !KNOWN_ROSTER_KEYS.has(key))
    .sort((left, right) => left.localeCompare(right, "es-MX"))
    .map((key) => Object.freeze({
      id: `legacy:${key}`,
      label: `Registro legado: ${key}`,
      legacy: true,
      rosterKey: key
    }));
  return Object.freeze([...canonical, ...legacy]);
}

export function getTeamLineupEntryValue(entry = {}, roster = {}, ternaRoster = []) {
  const source = asRecord(roster);
  if (entry.legacy) return source[entry.rosterKey] ?? "";
  if (entry.rosterKey === "terna") return Array.isArray(ternaRoster) ? ternaRoster[entry.rosterIndex] || "" : "";
  if (Number.isInteger(entry.rosterIndex)) return Array.isArray(source[entry.rosterKey]) ? source[entry.rosterKey][entry.rosterIndex] || "" : "";
  return source[entry.rosterKey || entry.id] || "";
}

function asRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}
