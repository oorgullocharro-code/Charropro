export const OFFICIAL_FORMAT_DOCUMENT_MODEL_VERSION = "1.0.0";

export const OFFICIAL_FORMAT_PAPER = deepFreeze({
  name: "OFICIO_MEXICANO_FMCH_2024_2028",
  orientation: "portrait",
  widthInches: 8.5,
  heightInches: 13.403333,
  widthMillimeters: 215.9,
  heightMillimeters: 340.44,
  sourcePagePoints: { width: 612, height: 965.04 },
  marginsInches: {
    left: 0.18,
    right: 0.18,
    top: 0.2,
    bottom: 0.2,
    header: 0,
    footer: 0
  }
});

export const OFFICIAL_FORMAT_TEXT_POLICY = deepFreeze({
  maximumPreferredLines: 2,
  minimumReadableFontPoints: 5.5,
  minimumReadableFontPixels: 7,
  wrap: true,
  horizontalAlignment: "center",
  verticalAlignment: "center",
  overflow: "clip-without-character-truncation"
});

export const OFFICIAL_FORMAT_WEB_DOCUMENT_WIDTH_PX = 1180;
export const OFFICIAL_FORMAT_MAX_WEB_WIDTH_PX = 5000;

export const OFFICIAL_FORMAT_COLUMN_WIDTHS = Object.freeze([
  6.5,
  4, 4, 4, 4, 4, 4, 4, 4,
  ...Array(23).fill(3.25)
]);

export const OFFICIAL_FORMAT_COLUMN_ROLES = Object.freeze([
  "side-control",
  ...Array(8).fill("participant"),
  ...Array(23).fill("score")
]);

const ROW_ROLE_SEQUENCE = Object.freeze([
  "institution-title", "institution-title",
  "header-metadata", "header-metadata", "header-metadata",
  "cala-section-title", "scoring-header", "scoring-value", "control-row", "spacer",
  "section-title", "scoring-header", "scoring-value", "control-row", "accumulated-control",
  "section-title", "scoring-header", "participant-row", "participant-row", "participant-row", "administrative-row", "coleadero-control-row", "team-infraction", "accumulated-control",
  "jineteo-header", "jineteo-value", "team-infraction", "accumulated-control", "spacer",
  "section-title", "scoring-header", "terna-participant", "terna-participant", "terna-participant", "team-infraction", "accumulated-control",
  "jineteo-header", "jineteo-value", "team-infraction", "accumulated-control", "spacer",
  "section-title", "scoring-header", "scoring-value", "team-infraction", "accumulated-control",
  "section-title", "scoring-header", "scoring-value", "team-infraction", "accumulated-control",
  "section-title", "scoring-header", "scoring-value", "team-infraction", "accumulated-control",
  "bad-points-total", "final-score", "spacer", "signature-label", "signature-line", "footer-text", "footer-quote", "footer-quote"
]);

export const OFFICIAL_FORMAT_ROW_ROLE_METRICS = deepFreeze({
  "institution-title": { xlsxPoints: 20, webPixels: 25 },
  "header-metadata": { xlsxPoints: 10, webPixels: 15 },
  "cala-section-title": { xlsxPoints: 16, webPixels: 22 },
  "section-title": { xlsxPoints: 16, webPixels: 22 },
  "scoring-header": { xlsxPoints: 14, webPixels: 20 },
  "scoring-value": { xlsxPoints: 14, webPixels: 20 },
  "participant-row": { xlsxPoints: 12, webPixels: 18 },
  "administrative-row": { xlsxPoints: 12, webPixels: 18 },
  "control-row": { xlsxPoints: 12, webPixels: 18 },
  "coleadero-control-row": { xlsxPoints: 12, webPixels: 18 },
  "team-infraction": { xlsxPoints: 14, webPixels: 20 },
  "accumulated-control": { xlsxPoints: 12, webPixels: 18 },
  "jineteo-header": { xlsxPoints: 32, webPixels: 42 },
  "jineteo-value": { xlsxPoints: 16, webPixels: 22 },
  "terna-participant": { xlsxPoints: 15, webPixels: 22 },
  "bad-points-total": { xlsxPoints: 14, webPixels: 20 },
  "final-score": { xlsxPoints: 16, webPixels: 22 },
  "signature-label": { xlsxPoints: 14, webPixels: 20 },
  "signature-line": { xlsxPoints: 16, webPixels: 24 },
  "footer-text": { xlsxPoints: 13, webPixels: 18 },
  "footer-quote": { xlsxPoints: 13, webPixels: 18 },
  "spacer": { xlsxPoints: 3, webPixels: 4 }
});

export const DOCUMENTED_CALA_BAD_POINT_CODES = deepFreeze({
  cala_inf_abrir_hocico: "AH",
  cala_inf_estrellar_despapar_gorbetear: "D",
  cala_inf_rabear_espiguear: "R"
});

const ABBREVIATION_STOP_WORDS = new Set([
  "A", "AL", "DE", "DEL", "LA", "EL", "LOS", "LAS", "EN", "CON", "POR", "PARA", "Y", "O", "SIN"
]);

export function buildOfficialFormatRowGeometry(rowCount = ROW_ROLE_SEQUENCE.length) {
  const count = Math.max(0, Math.floor(Number(rowCount) || 0));
  const roles = Array.from({ length: count }, (_, index) => ROW_ROLE_SEQUENCE[index] || "scoring-value");
  return deepFreeze({
    roles,
    xlsxHeights: roles.map((role) => OFFICIAL_FORMAT_ROW_ROLE_METRICS[role].xlsxPoints),
    webHeights: roles.map((role) => OFFICIAL_FORMAT_ROW_ROLE_METRICS[role].webPixels)
  });
}

export function buildCalaDocumentAbbreviationMatrix(rules = []) {
  const normalized = (Array.isArray(rules) ? rules : [])
    .map((rule) => ({
      ruleId: clean(rule?.id || rule?.ruleId),
      canonicalName: clean(rule?.label || rule?.canonicalName)
    }))
    .filter((rule) => rule.ruleId && rule.canonicalName)
    .sort((left, right) => left.ruleId.localeCompare(right.ruleId));
  const usedCodes = new Map();
  const result = [];

  for (const rule of normalized) {
    const documented = DOCUMENTED_CALA_BAD_POINT_CODES[rule.ruleId];
    const baseCode = documented || generateAbbreviationBase(rule.canonicalName, rule.ruleId);
    const code = documented || resolveGeneratedCollision(baseCode, rule.ruleId, usedCodes);
    const existing = usedCodes.get(code);
    if (existing && existing !== rule.ruleId) {
      throw new Error(`official-format-document-abbreviation-collision:${code}`);
    }
    usedCodes.set(code, rule.ruleId);
    result.push(deepFreeze({
      ruleId: rule.ruleId,
      canonicalName: rule.canonicalName,
      code,
      source: documented ? "DOCUMENTED" : "GENERATED",
      documentProfileId: "FMCH_TEAM_SHEET_2024_2028",
      documentProfileVersion: "1.0.0"
    }));
  }

  return Object.freeze(result);
}

function generateAbbreviationBase(canonicalName, ruleId) {
  const words = normalizeWords(canonicalName);
  let code = words.map((word) => word[0]).join("").slice(0, 4);
  if (code.length < 2) {
    const significant = words.join("") || clean(ruleId).replace(/^cala_inf_/, "");
    code = normalizeToken(significant).slice(0, 4);
  }
  return (code || "DOC").slice(0, 4);
}

function resolveGeneratedCollision(baseCode, ruleId, usedCodes) {
  if (!usedCodes.has(baseCode)) return baseCode;
  const seed = stableCodeSeed(ruleId);
  for (let index = 0; index < seed.length; index += 1) {
    const suffixLength = Math.min(2, index + 1);
    const prefixLength = Math.max(2, 4 - suffixLength);
    const candidate = `${baseCode.slice(0, prefixLength)}${seed.slice(0, suffixLength)}`.slice(0, 4);
    if (!usedCodes.has(candidate)) return candidate;
  }
  throw new Error(`official-format-document-abbreviation-exhausted:${ruleId}`);
}

function normalizeWords(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter((word) => word && !ABBREVIATION_STOP_WORDS.has(word));
}

function normalizeToken(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function stableCodeSeed(value) {
  let hash = 2166136261;
  for (const character of String(value || "")) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash.toString(36).toUpperCase().padStart(7, "0");
}

function clean(value) {
  return String(value || "").trim();
}

function deepFreeze(value, seen = new WeakSet()) {
  if (!value || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  Object.values(value).forEach((item) => deepFreeze(item, seen));
  return Object.freeze(value);
}
