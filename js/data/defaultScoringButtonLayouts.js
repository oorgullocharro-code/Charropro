export const SCORING_BUTTON_GROUPS = [
  { id: "quickActions", title: "Calificaciones base", icon: "target", defaultOpen: true },
  { id: "infractions", title: "Infracciones", icon: "warning", defaultOpen: false },
  { id: "time", title: "Tiempo / Cronometro", icon: "timer", defaultOpen: false },
  { id: "manual", title: "Manual", icon: "hand", defaultOpen: false },
  { id: "more", title: "Mas", icon: "dots", defaultOpen: false }
];

export const DEFAULT_SCORING_BUTTON_LAYOUTS = {
  cala: createEmptyLayout(),
  piales: createEmptyLayout(),
  colas: createEmptyLayout(),
  toro: createEmptyLayout(),
  yegua: createEmptyLayout(),
  terna: createEmptyLayout(),
  manganas_pie: createEmptyLayout(),
  manganas_caballo: createEmptyLayout(),
  paso: createEmptyLayout(),
  jineteo_toro: createEmptyLayout(),
  jineteo_yegua: createEmptyLayout(),
  paso_muerte: createEmptyLayout()
};

export function createEmptyLayout() {
  return {
    quickActions: [],
    infractions: [],
    time: [],
    manual: [],
    more: [],
    buttons: {}
  };
}

export function normalizeScoringButtonLayouts(layouts = {}) {
  if (!layouts || typeof layouts !== "object") return {};
  return Object.fromEntries(
    Object.entries(layouts)
      .filter(([suerteId, layout]) => suerteId && layout && typeof layout === "object")
      .map(([suerteId, layout]) => [suerteId, normalizeScoringButtonLayout(layout)])
  );
}

export function normalizeScoringButtonLayout(layout = {}) {
  const normalized = createEmptyLayout();
  SCORING_BUTTON_GROUPS.forEach((group) => {
    normalized[group.id] = Array.isArray(layout[group.id]) ? layout[group.id].map(String) : [];
  });
  normalized.buttons = normalizeScoringButtonOverrides(layout.buttons || layout);
  normalized.updatedAt = layout.updatedAt || null;
  return normalized;
}

export function normalizeScoringButtonOverrides(buttons = {}) {
  if (!buttons || typeof buttons !== "object") return {};
  return Object.fromEntries(
    Object.entries(buttons)
      .filter(([id, button]) => id && button && typeof button === "object" && !Array.isArray(button))
      .map(([id, button]) => [
        id,
        {
          enabled: button.enabled !== false,
          group: normalizeScoringButtonGroup(button.group),
          order: Number.isFinite(Number(button.order)) ? Number(button.order) : 999,
          shortLabel: String(button.shortLabel || button.label || "").trim(),
          icon: String(button.icon || "").trim(),
          requiresConfirmation: Boolean(button.requiresConfirmation)
        }
      ])
  );
}

export function normalizeScoringButtonGroup(groupId) {
  return SCORING_BUTTON_GROUPS.some((group) => group.id === groupId) ? groupId : "more";
}
