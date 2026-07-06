import {
  CALA_ADIC_RULES,
  CALA_BASE_RULES,
  CALA_DESC_RULES,
  CALA_INFR_RULES,
  normalizeCalaRuleOverrideCatalog
} from "./calaRules.js?v=20260706-release22d-active-charreada-source2";

export const SUERTES = [
  {
    id: "cala",
    name: "Cala",
    fullName: "Cala de Caballo",
    attempts: 1,
    catalog: {
      base: CALA_BASE_RULES,
      adic: CALA_ADIC_RULES,
      infr: CALA_INFR_RULES,
      desc: CALA_DESC_RULES
    }
  },
  {
    id: "piales",
    name: "Piales",
    fullName: "Piales en el Lienzo",
    attempts: 3,
    catalog: {
      base: [
        { id: "pb1", pts: 18, label: "Remolineado" },
        { id: "pb2", pts: 20, label: "Madera" },
        { id: "pb3", pts: 24, label: "Floreado" }
      ],
      adic: [
        { id: "pa1", pts: 1, label: "Dist. 10m-30m (+1)" },
        { id: "pa2", pts: 2, label: "Dist. 30-40m (+2)" },
        { id: "pa3", pts: 3, label: "Dist. +40m (+3)" },
        { id: "pa4", pts: 1, label: "Canilla (+1)" },
        { id: "pa5", pts: 1, label: "Sobra Tiempo (+1)" },
        { id: "pa6", pts: 1, label: "Adic (+1)" }
      ],
      infr: [
        { id: "pi1", pts: 1, label: "Perder vuelta (-1)" },
        { id: "pi2", pts: 2, label: "Chorrear antes (-2)" },
        { id: "pi3", pts: 1, label: "Pisar soga (-1)" },
        { id: "pi4", pts: 2, label: "Amarrar mal (-2)" },
        { id: "pi8", pts: 1, label: "Tiempo extra (-1)" }
      ],
      desc: [
        { id: "pd1", label: "Reventar soga" },
        { id: "pd2", label: "Soltar caballo" },
        { id: "pd4", label: "Fuera de tiempo" }
      ]
    }
  },
  {
    id: "colas",
    name: "Colas",
    fullName: "Coleadero",
    attempts: 3,
    type: "coleadero",
    catalog: {
      base: [
        { id: "cob1", pts: 6, label: "Pachon (6)" },
        { id: "cob2", pts: 8, label: "Medio (8)" },
        { id: "cob3", pts: 10, label: "Redonda (10)" },
        { id: "cob4", pts: 12, label: "Redonda Der. (12)" }
      ],
      adic: [
        { id: "coa1", pts: 1, label: "Distancia 1 (+1)" },
        { id: "coa2", pts: 2, label: "Distancia 2 (+2)" },
        { id: "coa3", pts: 3, label: "Distancia 3 (+3)" },
        { id: "coa4", pts: 1, label: "Caida Rapida (+1)" }
      ],
      infr: [
        { id: "coi1", pts: 1, label: "Agarrar barriga (-1)" },
        { id: "coi2", pts: 1, label: "Perder estribo (-1)" },
        { id: "coi3", pts: 2, label: "Salir montura (-2)" },
        { id: "coi4", pts: 1, label: "Saludar tarde (-1)" },
        { id: "coi5", pts: 1, label: "Tocar toro (-1)" },
        { id: "coi6", pts: 2, label: "Caer jinete (-2)" },
        { id: "coi8", pts: 2, label: "Cruzarse (-2)" }
      ],
      desc: [
        { id: "cod1", label: "Soltar toro vivo" },
        { id: "cod2", label: "Caida grave" },
        { id: "cod3", label: "Tirar caballo" },
        { id: "cod4", label: "Fuera de zona" }
      ]
    }
  },
  {
    id: "toro",
    name: "Toro",
    fullName: "Jineteo de Toro",
    attempts: 1,
    catalog: {
      base: [
        { id: "tb1", pts: 14, label: "Pretal Gasa (14)" },
        { id: "tb2", pts: 18, label: "Pretal Clasico (18)" }
      ],
      adic: [
        { id: "t1m", pts: 1, label: "1 Mano (+1)" },
        { id: "tpi", pts: 1, label: "Piernas (+1)" },
        { id: "ttm", pts: 1, label: "Tentemozo (+1)" },
        { id: "tvp", pts: 1, label: "Verijero (+1)" },
        { id: "tcl", pts: 1, label: "Caer y Levanta (+1)" },
        { id: "tbl", pts: 1, label: "Bajar sin lazo (+1)" },
        { id: "tta", pts: 1, label: "T. Ahorrado (+1)" },
        { id: "tta2", pts: 2, label: "T. Ahorrado (+2)" }
      ],
      infr: [
        { id: "ti1", pts: 1, label: "Baja sin lazar (-1)" },
        { id: "ti2", pts: 2, label: "Hacer palanca (-2)" },
        { id: "ti4", pts: 2, label: "Uso de Puerta (-2)" },
        { id: "ti6", pts: 1, label: "Falta Control (-1)" },
        { id: "ttm", pts: 1, label: "Tiempo excedido (-1)" }
      ],
      desc: [
        { id: "td1", label: "Toro no repara" },
        { id: "td2", label: "Desmontado en Cajon" },
        { id: "td3", label: "Caida de Jinete" }
      ]
    }
  },
  {
    id: "lazo",
    name: "Lazo",
    fullName: "Lazo a la Cabeza",
    attempts: 3,
    catalog: {
      base: [{ id: "lb1", pts: 10, label: "Base Lazo (10)" }],
      adic: [
        { id: "la1", pts: 12, label: "Remate (+12)" },
        { id: "la2", pts: 14, label: "Remate (+14)" },
        { id: "la3", pts: 16, label: "Remate (+16)" },
        { id: "la4", pts: 1, label: "Floreo (+1)" },
        { id: "la5", pts: 2, label: "Floreo (+2)" },
        { id: "la6", pts: 1, label: "T. Ahorrado (+1)" }
      ],
      infr: [
        { id: "li1", pts: 1, label: "Falta menor (-1)" },
        { id: "li2", pts: 2, label: "Falta grave (-2)" },
        { id: "li3", pts: 1, label: "Tiempo (-1)" }
      ],
      desc: [
        { id: "ld1", label: "Cero en la Suerte" },
        { id: "ld2", label: "Soltar soga" }
      ]
    }
  },
  {
    id: "pial_ruedo",
    name: "Pial R.",
    fullName: "Pial en el Ruedo",
    attempts: 3,
    catalog: {
      base: [{ id: "prb1", pts: 10, label: "Base Pial (10)" }],
      adic: [
        { id: "pra1", pts: 10, label: "Remate (+10)" },
        { id: "pra2", pts: 12, label: "Remate (+12)" },
        { id: "pra3", pts: 14, label: "Remate (+14)" },
        { id: "pra4", pts: 1, label: "Floreo (+1)" },
        { id: "pra5", pts: 2, label: "Floreo (+2)" },
        { id: "pra6", pts: 1, label: "T. Ahorrado (+1)" }
      ],
      infr: [
        { id: "pri1", pts: 1, label: "Falta menor (-1)" },
        { id: "pri2", pts: 2, label: "Falta grave (-2)" },
        { id: "pri3", pts: 1, label: "Tiempo (-1)" }
      ],
      desc: [
        { id: "prd1", label: "Cero en la Suerte" },
        { id: "prd2", label: "Soltar soga" }
      ]
    }
  },
  {
    id: "yegua",
    name: "Yegua",
    fullName: "Jineteo de Yegua",
    attempts: 1,
    catalog: {
      base: [
        { id: "yb1", pts: 14, label: "Base Gasa (14)" },
        { id: "yb2", pts: 18, label: "Base Clasico (18)" }
      ],
      adic: [
        { id: "ya1", pts: 1, label: "1 Mano (+1)" },
        { id: "ya2", pts: 1, label: "Piernas (+1)" },
        { id: "ya3", pts: 1, label: "Tentemozo (+1)" },
        { id: "ya4", pts: 1, label: "Verijero (+1)" },
        { id: "ya5", pts: 1, label: "Caer y Lev. (+1)" },
        { id: "ya6", pts: 1, label: "Bajar Oreja (+1)" },
        { id: "ya7", pts: 1, label: "T. Ahorrado (+1)" },
        { id: "ya8", pts: 2, label: "T. Ahorrado (+2)" }
      ],
      infr: [
        { id: "yi1", pts: 1, label: "Falta Control (-1)" },
        { id: "yi2", pts: 2, label: "Hacer palanca (-2)" },
        { id: "yi3", pts: 1, label: "Tiempo (-1)" }
      ],
      desc: [
        { id: "yd1", label: "No repara" },
        { id: "yd2", label: "Caida de Jinete" }
      ]
    }
  },
  {
    id: "manganas_pie",
    name: "Mang. Pie",
    fullName: "Manganas a Pie",
    attempts: 3,
    catalog: {
      base: [
        { id: "mpb1", pts: 10, label: "Rodada (10)" },
        { id: "mpb2", pts: 10, label: "Sencilla (10)" },
        { id: "mpb3", pts: 10, label: "Mascara (10)" },
        { id: "mpb4", pts: 12, label: "Desden (12)" }
      ],
      adic: [
        { id: "mpa1", pts: 1, label: "Floreo (+1)" },
        { id: "mpa2", pts: 2, label: "Floreo (+2)" },
        { id: "mpa3", pts: 3, label: "Floreo (+3)" },
        { id: "mpa4", pts: 4, label: "Floreo (+4)" },
        { id: "mpa5", pts: 5, label: "Floreo (+5)" },
        { id: "mpa6", pts: 1, label: "T. Ahorrado (+1)" },
        { id: "mpa7", pts: 2, label: "T. Ahorrado (+2)" }
      ],
      infr: [
        { id: "mpi1", pts: 1, label: "Chorrear mal (-1)" },
        { id: "mpi2", pts: 2, label: "Soltar soga (-2)" },
        { id: "mpi3", pts: 1, label: "Tiempo (-1)" }
      ],
      desc: [{ id: "mpd1", label: "Cero en el tiro" }]
    }
  },
  {
    id: "manganas_caballo",
    name: "Mang. Cab",
    fullName: "Manganas a Caballo",
    attempts: 3,
    catalog: {
      base: [
        { id: "mcb1", pts: 10, label: "Rodada (10)" },
        { id: "mcb2", pts: 10, label: "Sencilla (10)" },
        { id: "mcb3", pts: 10, label: "Mascara (10)" },
        { id: "mcb4", pts: 12, label: "Desden (12)" }
      ],
      adic: [
        { id: "mca1", pts: 1, label: "Floreo (+1)" },
        { id: "mca2", pts: 2, label: "Floreo (+2)" },
        { id: "mca3", pts: 3, label: "Floreo (+3)" },
        { id: "mca4", pts: 4, label: "Floreo (+4)" },
        { id: "mca5", pts: 5, label: "Floreo (+5)" },
        { id: "mca6", pts: 1, label: "T. Ahorrado (+1)" },
        { id: "mca7", pts: 2, label: "T. Ahorrado (+2)" }
      ],
      infr: [
        { id: "mci1", pts: 1, label: "Pisar soga (-1)" },
        { id: "mci2", pts: 2, label: "Soltar soga (-2)" },
        { id: "mci3", pts: 1, label: "Tiempo (-1)" }
      ],
      desc: [{ id: "mcd1", label: "Cero en el tiro" }]
    }
  },
  {
    id: "paso",
    name: "Paso",
    fullName: "Paso de la Muerte",
    attempts: 1,
    catalog: {
      base: [
        { id: "pab1", pts: 20, label: "1ra Vuelta (20)" },
        { id: "pab2", pts: 15, label: "2da Vuelta (15)" }
      ],
      adic: [
        { id: "paa1", pts: 1, label: "Distancia (+1)" },
        { id: "paa2", pts: 2, label: "Distancia (+2)" },
        { id: "paa3", pts: 2, label: "Cuarta (+2)" },
        { id: "paa4", pts: 2, label: "Reparos (+2)" },
        { id: "paa5", pts: 1, label: "Oreja C/P (+1)" }
      ],
      infr: [
        { id: "pai1", pts: 1, label: "Apoyo indebido (-1)" },
        { id: "pai2", pts: 2, label: "Caida de arreador (-2)" }
      ],
      desc: [
        { id: "pad1", label: "No realizarlo" },
        { id: "pad2", label: "Caida del Jinete" }
      ]
    }
  }
];

export const SUERTE_IDS = SUERTES.map((suerte) => suerte.id);

export const TOURNAMENT_TYPES = [
  {
    id: "completo",
    name: "Torneo completo",
    shortName: "Completo",
    description: "Charreada completa con todas las suertes.",
    suerteIds: SUERTE_IDS
  },
  {
    id: "caladero",
    name: "Caladero",
    shortName: "Caladero",
    description: "Solo Cala de Caballo.",
    suerteIds: ["cala"]
  },
  {
    id: "coleadero",
    name: "Coleadero",
    shortName: "Coleadero",
    description: "Solo Coleadero.",
    suerteIds: ["colas"]
  }
];

export function getSuerteById(id) {
  return SUERTES.find((suerte) => suerte.id === id);
}

export function getSuerteIndex(id) {
  return SUERTES.findIndex((suerte) => suerte.id === id);
}

export function normalizeTournamentType(type) {
  return TOURNAMENT_TYPES.some((item) => item.id === type) ? type : "completo";
}

export function getTournamentTypeConfig(type) {
  const normalized = normalizeTournamentType(type);
  return TOURNAMENT_TYPES.find((item) => item.id === normalized) || TOURNAMENT_TYPES[0];
}

export function getTournamentSuertes(tournament = {}, globalRuleOverrides = null) {
  const config = getTournamentTypeConfig(tournament?.type);
  const generalOverrides = globalRuleOverrides || tournament?.globalRuleOverrides || {};
  const tournamentOverrides = tournament?.ruleOverrides || {};
  return config.suerteIds
    .map((suerteId) => {
      const globalSuerte = applyTournamentRuleOverride(getSuerteById(suerteId), generalOverrides[suerteId]);
      return applyTournamentRuleOverride(globalSuerte, tournamentOverrides[suerteId]);
    })
    .filter(Boolean);
}

function applyTournamentRuleOverride(suerte, override) {
  if (!suerte) return null;
  const nextSuerte = cloneSuerte(suerte);
  if (!override?.catalog) return nextSuerte;
  const overrideCatalog = nextSuerte.id === "cala"
    ? normalizeCalaRuleOverrideCatalog(override.catalog)
    : override.catalog;

  ["base", "adic", "infr", "desc"].forEach((group) => {
    const rules = Array.isArray(overrideCatalog[group])
      ? overrideCatalog[group]
      : nextSuerte.catalog[group] || [];
    nextSuerte.catalog[group] = normalizeRulesForUse(rules, group);
  });

  return nextSuerte;
}

function cloneSuerte(suerte) {
  return JSON.parse(JSON.stringify(suerte));
}

function normalizeRulesForUse(rules, group) {
  return (rules || [])
    .filter((rule) => rule && rule.enabled !== false)
    .map((rule) => {
      const nextRule = {
        id: rule.id || `rule_${Math.random().toString(36).slice(2, 8)}`,
        label: String(rule.label || "").trim() || "Sin nombre"
      };

      if (group !== "desc") nextRule.pts = Number(rule.pts || 0);
      return nextRule;
    });
}
