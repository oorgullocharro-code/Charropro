export const ROLES = {
  GRAFICOS: "graficos",
  LOCUTOR: "locutor",
  OPERADOR: "operador",
  JUEZ: "juez",
  ORGANIZADOR: "organizador",
  SUPERVISOR: "supervisor",
  LECTURA: "lectura",
  SIN_ACCESO: "sin_acceso"
};

export const ROLE_LABELS = {
  [ROLES.GRAFICOS]: "Graficos",
  [ROLES.LOCUTOR]: "Locutor",
  [ROLES.OPERADOR]: "Operador",
  [ROLES.JUEZ]: "Juez",
  [ROLES.ORGANIZADOR]: "Organizador",
  [ROLES.SUPERVISOR]: "Supervisor",
  [ROLES.LECTURA]: "Solo lectura",
  [ROLES.SIN_ACCESO]: "Sin acceso"
};

export const ROLE_OPTIONS = [
  ROLES.SUPERVISOR,
  ROLES.OPERADOR,
  ROLES.JUEZ,
  ROLES.LOCUTOR,
  ROLES.GRAFICOS,
  ROLES.ORGANIZADOR,
  ROLES.LECTURA
];

const ROLE_ALIASES = {
  admin: ROLES.SUPERVISOR,
  administrador: ROLES.SUPERVISOR,
  supervisor: ROLES.SUPERVISOR,
  operador: ROLES.OPERADOR,
  operator: ROLES.OPERADOR,
  juez: ROLES.JUEZ,
  judge: ROLES.JUEZ,
  locutor: ROLES.LOCUTOR,
  speaker: ROLES.LOCUTOR,
  graficos: ROLES.GRAFICOS,
  graphics: ROLES.GRAFICOS,
  grafico: ROLES.GRAFICOS,
  organizador: ROLES.ORGANIZADOR,
  organizer: ROLES.ORGANIZADOR,
  lectura: ROLES.LECTURA,
  readonly: ROLES.LECTURA,
  read_only: ROLES.LECTURA,
  "solo lectura": ROLES.LECTURA,
  solo_lectura: ROLES.LECTURA,
  viewer: ROLES.LECTURA
};

const CAPABILITIES = {
  [ROLES.SUPERVISOR]: new Set([
    "read",
    "operate",
    "score",
    "timer",
    "manage",
    "rules",
    "settings",
    "supervise",
    "audit",
    "users",
    "graphics",
    "speaker",
    "sync"
  ]),
  [ROLES.OPERADOR]: new Set([
    "read",
    "operate",
    "score",
    "timer",
    "manage",
    "rules",
    "settings",
    "audit",
    "graphics",
    "speaker",
    "sync"
  ]),
  [ROLES.JUEZ]: new Set(["read", "score", "timer", "sync"]),
  [ROLES.LOCUTOR]: new Set(["read", "speaker"]),
  [ROLES.GRAFICOS]: new Set(["read", "graphics"]),
  [ROLES.ORGANIZADOR]: new Set(["read", "audit", "speaker"]),
  [ROLES.LECTURA]: new Set(["read"]),
  [ROLES.SIN_ACCESO]: new Set([])
};

export function normalizeRole(role) {
  const clean = String(role || "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_")
    .replace(/\s+/g, " ");

  return ROLE_ALIASES[clean] || ROLE_ALIASES[clean.replace(/\s+/g, "_")] || ROLES.SIN_ACCESO;
}

export function getRoleLabel(role) {
  return ROLE_LABELS[normalizeRole(role)] || ROLE_LABELS[ROLES.SIN_ACCESO];
}

export function roleCan(role, capability) {
  return CAPABILITIES[normalizeRole(role)]?.has(capability) || false;
}

export function normalizeTournamentAccess(profile = {}) {
  const mode = profile.tournamentAccess === "selected" ? "selected" : "all";
  const ids = Array.isArray(profile.tournamentIds)
    ? profile.tournamentIds
    : Array.isArray(profile.assignedTournamentIds)
      ? profile.assignedTournamentIds
      : [];

  return {
    tournamentAccess: mode,
    tournamentIds: [...new Set(ids.map((id) => String(id || "").trim()).filter(Boolean))]
  };
}

export function hasTournamentAccess(session = {}, tournamentId = "") {
  if (!isActiveAccessSession(session)) return false;
  const role = normalizeRole(session.role);
  if (role === ROLES.SUPERVISOR) return true;

  const access = normalizeTournamentAccess(session);
  if (access.tournamentAccess !== "selected") return true;
  if (!tournamentId) return false;
  return access.tournamentIds.includes(String(tournamentId));
}

export function isActiveAccessSession(session = {}) {
  return Boolean(session.user && session.active !== false && normalizeRole(session.role) !== ROLES.SIN_ACCESO);
}

export function makeAccessSession(user = null, profile = null) {
  if (!user) {
    return {
      ready: true,
      user: null,
      uid: "",
      email: "",
      name: "",
      role: ROLES.SIN_ACCESO,
      active: false
    };
  }

  const tournamentAccess = normalizeTournamentAccess(profile || {});

  return {
    ready: true,
    user,
    uid: user.uid || "",
    email: user.email || profile?.email || "",
    name: profile?.name || user.displayName || user.email || "Usuario",
    role: normalizeRole(profile?.role),
    active: profile?.active !== false,
    ...tournamentAccess
  };
}
