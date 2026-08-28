import {
  createOfficialFormatSnapshot,
  validateOfficialFormatSnapshot
} from "./officialFormatSnapshot.js?v=20260828-fmch-terna-federation-format-row-ownership-001-v1";
import { OFFICIAL_FORMAT_DOCUMENT_ASSET_BASE64 } from "./officialFormatDocumentAssets.js?v=20260828-fmch-terna-federation-format-row-ownership-001-v1";
import {
  OFFICIAL_FORMAT_COLUMN_ROLES,
  OFFICIAL_FORMAT_COLUMN_WIDTHS,
  OFFICIAL_FORMAT_DOCUMENT_MODEL_VERSION,
  OFFICIAL_FORMAT_PAPER,
  OFFICIAL_FORMAT_TEXT_POLICY,
  OFFICIAL_FORMAT_WEB_DOCUMENT_WIDTH_PX,
  buildOfficialFormatRowGeometry
} from "./officialFormatDocumentModel.js?v=20260828-fmch-terna-federation-format-row-ownership-001-v1";
import { state } from "./state.js?v=20260828-fmch-terna-federation-format-row-ownership-001-v1";
import { createXlsxBlob } from "./xlsx.js?v=20260828-fmch-terna-federation-format-row-ownership-001-v1";

export const OFFICIAL_FORMAT_NAME = "HOJA-CALIFICACION-EQUIPO-CHARROS-2024-2028";
export { OFFICIAL_FORMAT_PAPER };

const SECTION_LABELS = Object.freeze({
  cala: "CALA DE CABALLO",
  piales: "PIALES EN EL LIENZO",
  coleadero: "COLEADERO",
  toro: "JINETEO DE TORO",
  terna: "TERNA EN EL RUEDO",
  yegua: "JINETEO DE YEGUA",
  manganasPie: "MANGANAS A PIE",
  manganasCaballo: "MANGANAS A CABALLO",
  paso: "PASO DE LA MUERTE"
});

export function buildOfficialPackage(input = {}) {
  const options = normalizePackageOptions(input);
  const sourceState = options.state || state;
  const charreadaId = options.charreadaId;
  const charreada = (sourceState.charreadas || []).find((item) => item.id === charreadaId) || null;
  const tournamentId = options.tournamentId || charreada?.tournamentId || "";
  const tournament = (sourceState.tournaments || []).find((item) => item.id === tournamentId) || null;
  const generatedAt = options.generatedAt || new Date().toISOString();

  if (!charreada || !tournament) {
    return {
      format: OFFICIAL_FORMAT_NAME,
      generatedAt,
      tournament: tournament ? compactTournament(tournament) : null,
      charreada: charreada ? compactCharreada(charreada) : null,
      sheets: [],
      warnings: [],
      errors: [!charreada ? "official-format-charreada-not-found" : "official-format-tournament-not-found"],
      documentStatus: "BLOCKED_SOURCE"
    };
  }

  const teamIds = options.teamId ? [options.teamId] : [...(charreada.teamIds || [])];
  const teams = teamIds
    .map((teamId) => (sourceState.teams || []).find((team) => team.id === teamId))
    .filter(Boolean);
  const officialScores = options.officialScores || sourceState.publishedScores || [];
  const officialScoreLedger = options.officialScoreLedger || sourceState.officialScoreLedger || {};
  const sheets = teams.map((team) => {
    const snapshot = createOfficialFormatSnapshot({
      tournament,
      charreada,
      team,
      officialScores,
      officialScoreLedger
    }, {
      tournamentId,
      charreadaId,
      teamId: team.id,
      generatedAt,
      officialScoreIds: options.officialScoreIds,
      officialScoreIdsByAttempt: options.officialScoreIdsByAttempt
    });
    return buildOfficialTeamSheet(snapshot);
  });

  const errors = [
    ...(teams.length ? [] : ["official-format-team-not-found"]),
    ...sheets.flatMap((sheet) => sheet.snapshot.errors)
  ];
  const warnings = sheets.flatMap((sheet) => sheet.snapshot.warnings);
  return {
    format: OFFICIAL_FORMAT_NAME,
    generatedAt,
    tournament: compactTournament(tournament),
    charreada: compactCharreada(charreada),
    sheets,
    warnings: [...new Set(warnings)],
    errors: [...new Set(errors)],
    documentStatus: errors.length
      ? "BLOCKED_SOURCE"
      : sheets.some((sheet) => sheet.snapshot.documentStatus === "BLOCKED_DOCUMENTAL")
        ? "BLOCKED_DOCUMENTAL"
        : "READY"
  };
}

export function buildOfficialTeamSheet(snapshot) {
  const validation = validateOfficialFormatSnapshot(snapshot);
  const institutional = buildInstitutionalPresentation(snapshot);
  const header = {
    evento: snapshot.eventMetadata.name,
    hora: snapshot.time,
    equipo: snapshot.teamMetadata.name,
    fecha: snapshot.date,
    capitan: snapshot.captain,
    lugar: snapshot.location
  };
  const rows = buildSnapshotRows(snapshot, header);
  const visual = buildOfficialVisualSheet(snapshot, header, institutional);
  const images = buildInstitutionalImages(institutional, visual);
  return {
    sheetName: safeSheetName(snapshot.teamMetadata.name),
    teamId: snapshot.teamId,
    teamName: snapshot.teamMetadata.name,
    header,
    totalMalos: snapshot.badPoints.total,
    puntuacionFinal: snapshot.finalScore,
    officialScoreTotal: snapshot.officialScoreTotal,
    documentStatus: snapshot.documentStatus,
    institutional,
    validation,
    snapshot,
    auditRows: rows,
    rows,
    visualRows: visual.rows,
    visualMerges: visual.merges,
    visualWidths: visual.widths,
    visualRowHeights: visual.rowHeights,
    visualRowRoles: visual.rowRoles,
    visualWebRowHeights: visual.webRowHeights,
    visualColumnRoles: visual.columnRoles,
    visualDocumentWidthPx: OFFICIAL_FORMAT_WEB_DOCUMENT_WIDTH_PX,
    documentModelVersion: OFFICIAL_FORMAT_DOCUMENT_MODEL_VERSION,
    textPolicy: OFFICIAL_FORMAT_TEXT_POLICY,
    visualImages: images
  };
}

export function buildOfficialWorkbook(officialPackage) {
  return {
    generatedAt: officialPackage?.generatedAt,
    sheets: (officialPackage?.sheets || []).map((sheet) => ({
      name: sheet.sheetName,
      rows: sheet.visualRows || sheet.rows,
      merges: sheet.visualMerges,
      widths: sheet.visualWidths,
      rowHeights: sheet.visualRowHeights,
      images: sheet.visualImages,
      orientation: "portrait",
      paperWidth: `${OFFICIAL_FORMAT_PAPER.widthInches}in`,
      paperHeight: `${OFFICIAL_FORMAT_PAPER.heightInches}in`,
      fitToWidth: 1,
      fitToHeight: 1,
      freezeRows: 0,
      showGridLines: false,
      horizontalCentered: true,
      margins: {
        ...OFFICIAL_FORMAT_PAPER.marginsInches
      }
    }))
  };
}

export function createOfficialFormatXlsxBlob(input = {}) {
  const official = input?.sheets ? input : buildOfficialPackage(input);
  return createXlsxBlob(buildOfficialWorkbook(official));
}

export function downloadOfficialFormatXlsx(input = {}) {
  const official = input?.sheets ? input : buildOfficialPackage(input);
  const blob = createXlsxBlob(buildOfficialWorkbook(official));
  const filename = `${slug(official.charreada?.name || "charreada")}-formato-federacion.xlsx`;
  downloadBlob(filename, blob);
}

export const downloadOfficialFormatCsv = downloadOfficialFormatXlsx;

function buildSnapshotRows(snapshot, header) {
  const institutional = buildInstitutionalPresentation(snapshot);
  const rows = [
    ["FEDERACION MEXICANA DE CHARRERIA, A.C."],
    ["EVENTO", header.evento, "HORA", header.hora],
    ["EQUIPO", header.equipo, "FECHA", header.fecha],
    ["CAPITAN", header.capitan, "LUGAR", header.lugar],
    []
  ];

  for (const [sectionId, section] of Object.entries(snapshot.suertes)) {
    if (sectionId === "cala") {
      const control = snapshot.documentalControls.calaSideBadPointsSumControl;
      rows.push([
        D("SUMA PUNTOS MALOS", control.fieldId, "DOCUMENT_CONTROL"),
        control.value,
        "CONTROL DOCUMENTAL",
        "SIN EFECTO DE SCORE"
      ]);
    }
    rows.push([SECTION_LABELS[sectionId] || sectionId]);
    rows.push([
      "#",
      "SUERTE",
      "CHARRO",
      "OPORTUNIDAD",
      "BASE",
      "ADICIONALES",
      "MALOS",
      "INFRACCION EQUIPO",
      "TOTAL OFICIAL",
      "DETALLE CONGELADO",
      "OFFICIAL SCORE ID"
    ]);
    section.attempts.forEach((attempt, index) => rows.push([
      index + 1,
      attempt.suerteName || attempt.suerteId,
      attempt.charro,
      attempt.opportunity?.number || attempt.attemptIndex + 1,
      attempt.baseSelection?.total || 0,
      sumSelectionTotals(attempt.additionalSelections),
      attempt.individualBadPoints,
      attempt.teamBadPoints,
      attempt.total,
      describeFrozenAttempt(attempt),
      attempt.officialScoreId
    ]));
    if (sectionId === "coleadero") {
      const administrativeRow = snapshot.documentalControls.coleaderoAdministrativeRow;
      rows.push([
        D("", administrativeRow.fieldId, "ADMINISTRATIVE_ROW"),
        "", "", "", "", "", "", "", "", "", ""
      ]);
    }
    rows.push([
      "TOTAL",
      SECTION_LABELS[sectionId] || sectionId,
      "",
      "",
      "",
      "",
      "",
      section.teamPenaltyTotal,
      section.total,
      "CONTROL",
      section.total === section.officialScoreTotal ? "PASS" : "MISMATCH"
    ]);
    if (sectionId === "coleadero") {
      const bottomControl = snapshot.documentalControls.coleaderoBottomControl04;
      rows.push([
        D("", bottomControl.fieldId, "DOCUMENT_CONTROL_EMPTY"),
        "", "", "", "", "", "", "", "", "", ""
      ]);
    }
    rows.push([]);
  }

  rows.push(["TOTAL PUNTOS MALOS", snapshot.badPoints.total]);
  rows.push(["PUNTUACION FINAL", snapshot.finalScore]);
  rows.push([]);
  rows.push(snapshot.documentalControls.signatures.flatMap((signature) => [
    D(signature.label, signature.fieldId, "MANUAL_SIGNATURE"),
    ""
  ]));
  rows.push(["", "", institutional.conadeName]);
  rows.push(["", "", institutional.sportsSecretariatPeriod]);
  rows.push(["", "", institutional.institutionalQuote]);
  return rows;
}

function buildInstitutionalPresentation(snapshot) {
  const fields = new Map((snapshot.institutionalFields || []).map((field) => [field.fieldId, field]));
  const field = (fieldId) => fields.get(fieldId) || {};
  const federationLogo = field("FMCH.TEAM_SHEET.HEADER.FEDERATION_LOGO");
  const conadeLogo = field("FMCH.TEAM_SHEET.FOOTER.CONADE_LOGO");
  return {
    profileId: snapshot.documentAuthority?.profileId || "",
    version: snapshot.documentAuthority?.version || "",
    sourceSha256: snapshot.documentAuthority?.sourceDocument?.sha256 || "",
    federationLogo: {
      path: federationLogo.value || "",
      sha256: federationLogo.sha256 || "",
      width: federationLogo.sourceCrop?.width || 0,
      height: federationLogo.sourceCrop?.height || 0
    },
    conadeLogo: {
      path: conadeLogo.value || "",
      sha256: conadeLogo.sha256 || "",
      width: conadeLogo.sourceCrop?.width || 0,
      height: conadeLogo.sourceCrop?.height || 0
    },
    conadeName: field("FMCH.TEAM_SHEET.FOOTER.CONADE_NAME").value || "",
    sportsSecretariatPeriod: field("FMCH.TEAM_SHEET.FOOTER.SPORTS_SECRETARIAT_PERIOD").value || "",
    institutionalQuote: field("FMCH.TEAM_SHEET.FOOTER.INSTITUTIONAL_QUOTE").value || ""
  };
}

function buildInstitutionalImages(institutional, visual) {
  return [
    {
      name: "fmch-emblem",
      mimeType: "image/png",
      base64: authorizedAssetBase64(institutional.federationLogo),
      col: 0,
      row: 0,
      width: 68,
      height: 68
    },
    {
      name: "conade-lockup",
      mimeType: "image/png",
      base64: authorizedAssetBase64(institutional.conadeLogo),
      col: 1,
      row: visual.conadeRow,
      width: 92,
      height: 48
    }
  ];
}

function authorizedAssetBase64(asset) {
  if (!asset?.path || !asset.sha256) throw new Error("official-format-document-asset-authority-required");
  const base64 = OFFICIAL_FORMAT_DOCUMENT_ASSET_BASE64[asset.path];
  if (!base64) throw new Error(`official-format-document-asset-missing:${asset.path}`);
  return base64;
}

function buildOfficialVisualSheet(snapshot, header, institutional) {
  const rowCount = 64;
  const columnCount = 32;
  const rows = Array.from({ length: rowCount }, () => Array.from({ length: columnCount }, () => C("", "plain")));
  const merges = [];
  const rowGeometry = buildOfficialFormatRowGeometry(rowCount);

  mergeVisual(rows, merges, 1, 5, 2, 32, "FEDERACIÓN MEXICANA DE CHARRERÍA, A.C.", "institutionTitle");
  headerField(rows, merges, 3, 5, 8, "EVENTO:", 9, 23, header.evento);
  headerField(rows, merges, 3, 24, 27, "HORA:", 28, 32, header.hora);
  headerField(rows, merges, 4, 5, 8, "EQUIPO:", 9, 23, header.equipo);
  headerField(rows, merges, 4, 24, 27, "FECHA:", 28, 32, header.fecha);
  headerField(rows, merges, 5, 5, 8, "CAPITÁN:", 9, 20, header.capitan);
  headerField(rows, merges, 5, 21, 24, "LUGAR:", 25, 32, header.lugar);
  buildCalaVisual(rows, merges, snapshot, 6);
  buildTripleAttemptVisual(rows, merges, snapshot.suertes.piales, {
    row: 11,
    title: "PIALES EN EL LIENZO",
    sideValue: badPointsControlValue(snapshot, "piales"),
    showT: false,
    control: accumulatedControl(snapshot, "piales")
  });
  buildColeaderoVisual(rows, merges, snapshot, 16);
  buildJineteoVisual(rows, merges, snapshot.suertes.toro, 25, "JINETEO DE TORO", "toro", badPointsControlValue(snapshot, "toro"), accumulatedControl(snapshot, "toro"));
  buildTernaVisual(rows, merges, snapshot, 30, badPointsControlValue(snapshot, "terna"), accumulatedControl(snapshot, "terna"));
  buildJineteoVisual(rows, merges, snapshot.suertes.yegua, 37, "JINETEO DE YEGUA", "yegua", badPointsControlValue(snapshot, "yegua"), accumulatedControl(snapshot, "yegua"));
  buildTripleAttemptVisual(rows, merges, snapshot.suertes.manganasPie, {
    row: 42,
    title: "MANGANAS A PIE",
    sideValue: badPointsControlValue(snapshot, "manganasPie"),
    showT: true,
    control: accumulatedControl(snapshot, "manganasPie")
  });
  buildTripleAttemptVisual(rows, merges, snapshot.suertes.manganasCaballo, {
    row: 47,
    title: "MANGANAS A CABALLO",
    sideValue: badPointsControlValue(snapshot, "manganasCaballo"),
    showT: true,
    control: accumulatedControl(snapshot, "manganasCaballo")
  });
  buildPasoVisual(rows, merges, snapshot.suertes.paso, 52, badPointsControlValue(snapshot, "paso"), accumulatedControl(snapshot, "paso"));
  buildClosingVisual(rows, merges, snapshot, institutional, 57);

  return {
    rows,
    merges,
    widths: OFFICIAL_FORMAT_COLUMN_WIDTHS,
    columnRoles: OFFICIAL_FORMAT_COLUMN_ROLES,
    rowHeights: rowGeometry.xlsxHeights,
    webRowHeights: rowGeometry.webHeights,
    rowRoles: rowGeometry.roles,
    conadeRow: 61
  };
}

function buildCalaVisual(rows, merges, snapshot, row) {
  const section = snapshot.suertes.cala;
  const attempt = section.attempts[0];
  mergeVisual(rows, merges, row, 1, row + 1, 1, "SUMA\nPUNTOS\nMALOS", "documentControl");
  putVisual(rows, row + 2, 1, snapshot.documentalControls.calaSideBadPointsSumControl.value, "documentControl");
  mergeVisual(rows, merges, row, 2, row, 9, "CALA DE CABALLO", "sectionTitle");
  mergeVisual(rows, merges, row + 1, 2, row + 2, 9, attempt?.charro || "", "participant");
  mergeVisual(rows, merges, row, 10, row, 17, calaDistanceHeading(attempt), "groupHeader");
  mergeVisual(rows, merges, row, 18, row, 26, "MALOS", "badHeader");
  mergeVisual(rows, merges, row, 27, row, 29, "TOTAL\nMALOS", "groupHeader");
  mergeVisual(rows, merges, row, 30, row, 32, "PUNTOS\nPARCIALES", "compactGroupHeader");
  const headings = ["BASE", "P", "T", "LD", "LI", "MD", "MI", "PC"];
  headings.forEach((heading, index) => putVisual(rows, row + 1, 10 + index, heading, "columnHeader"));
  for (let col = 18; col <= 26; col += 1) putVisual(rows, row + 1, col, "-", "columnHeader");
  mergeVisual(rows, merges, row + 1, 27, row + 1, 29, "", "columnHeader");
  mergeVisual(rows, merges, row + 1, 30, row + 1, 32, "", "columnHeader");
  const values = calaScoreValues(attempt);
  values.slice(0, 8).forEach((value, index) => putVisual(rows, row + 2, 10 + index, value, "scoreCell"));
  const badSlots = (attempt?.documentalEvidence?.badPointSlots || []).slice(0, 8);
  const badRanges = [[18, 18], [19, 19], [20, 20], [21, 21], [22, 22], [23, 23], [24, 24], [25, 26]];
  badRanges.forEach(([start, end], index) => {
    const slot = badSlots[index];
    mergeVisual(rows, merges, row + 1, start, row + 1, end, slot ? calaBadPointCode(slot) : "-", "badCodeCell");
    mergeVisual(rows, merges, row + 2, start, row + 2, end, slot ? finite(slot.value) : "-", "badScoreCell");
  });
  mergeVisual(rows, merges, row + 2, 27, row + 2, 29, attempt ? attempt.individualBadPoints : "", "totalCell");
  mergeVisual(rows, merges, row + 2, 30, row + 2, 32, attempt ? attempt.total : "", "totalCell");
  mergeVisual(rows, merges, row + 3, 2, row + 3, 9, "SUPLENTE", "substitute");
  mergeVisual(rows, merges, row + 3, 20, row + 3, 27, "INFRACCIÓN AL EQUIPO", "plainLabel");
  mergeVisual(rows, merges, row + 3, 28, row + 3, 32, sectionValueOrDash(section, "teamPenaltyTotal"), "controlBox");
}

function buildTripleAttemptVisual(rows, merges, section, options) {
  const { row, title, showT } = options;
  const attempts = section.attempts || [];
  mergeVisual(rows, merges, row, 1, row + 2, 1, options.sideValue || "", "documentControl");
  mergeVisual(rows, merges, row, 2, row, 9, title, "sectionTitle");
  mergeVisual(rows, merges, row + 1, 2, row + 2, 9, attempts[0]?.charro || "", "participant");
  const groups = showT
    ? [[10, 16], [17, 23], [24, 29]]
    : [[10, 16], [17, 23], [24, 30]];
  groups.forEach(([start, end], index) => {
    mergeVisual(rows, merges, row, start, row, end, `${index + 1}${ordinalSuffix(index + 1)} TIRO`, "groupHeader");
    const width = end - start + 1;
    const goodEnd = start + Math.max(1, Math.floor(width / 3)) - 1;
    const badEnd = goodEnd + Math.max(1, Math.floor(width / 3));
    mergeVisual(rows, merges, row + 1, start, row + 1, goodEnd, "BUENO", "columnHeader");
    mergeVisual(rows, merges, row + 1, goodEnd + 1, row + 1, badEnd, "MALOS", "badHeader");
    mergeVisual(rows, merges, row + 1, badEnd + 1, row + 1, end, "TOTAL", "columnHeader");
    const attempt = attempts[index];
    mergeVisual(rows, merges, row + 2, start, row + 2, goodEnd, attempt ? attemptGoodExcludingTime(attempt) : "-", "scoreCell");
    mergeVisual(rows, merges, row + 2, goodEnd + 1, row + 2, badEnd, attempt ? attempt.individualBadPoints : "-", "badScoreCell");
    mergeVisual(rows, merges, row + 2, badEnd + 1, row + 2, end, attempt ? attemptNetExcludingTime(attempt) : "-", "totalCell");
  });
  if (showT) {
    putVisual(rows, row, 30, "T", "groupHeader");
    putVisual(rows, row + 1, 30, "", "columnHeader");
    putVisual(rows, row + 2, 30, sectionTimePoints(section), "scoreCell");
  }
  mergeVisual(rows, merges, row, 31, row + 1, 32, "TOTAL", "groupHeader");
  mergeVisual(rows, merges, row + 2, 31, row + 2, 32, section.total, "totalCell");
  mergeVisual(rows, merges, row + 3, 2, row + 3, 9, "SUPLENTE", "substitute");
  if (showT) {
    mergeVisual(rows, merges, row + 3, 11, row + 3, 18, "TERMINADO EN", "plainLabel");
    mergeVisual(rows, merges, row + 3, 19, row + 3, 21, sectionTime(section), "controlBox");
    mergeVisual(rows, merges, row + 3, 22, row + 3, 23, "MIN.", "plainLabel");
  }
  mergeVisual(rows, merges, row + 3, 24, row + 3, 28, "INFRACCIÓN AL EQUIPO", "plainLabel");
  mergeVisual(rows, merges, row + 3, 29, row + 3, 32, sectionValueOrDash(section, "teamPenaltyTotal"), "controlBox");
  buildPostSectionControls(rows, merges, row + 4, options.control);
}

function buildColeaderoVisual(rows, merges, snapshot, row) {
  const section = snapshot.suertes.coleadero;
  const attempts = section.attempts || [];
  mergeVisual(rows, merges, row, 1, row + 5, 1, badPointsControlValue(snapshot, "coleadero"), "documentControl");
  mergeVisual(rows, merges, row, 2, row, 9, "COLEADERO", "sectionTitle");
  const groups = [[10, 16], [17, 23], [24, 30]];
  groups.forEach(([start, end], index) => {
    mergeVisual(rows, merges, row, start, row, end, `${index + 1}${ordinalSuffix(index + 1)} PASADA`, "groupHeader");
    mergeVisual(rows, merges, row + 1, start, row + 1, start + 1, "BUENOS", "columnHeader");
    mergeVisual(rows, merges, row + 1, start + 2, row + 1, start + 4, "MALOS", "badHeader");
    mergeVisual(rows, merges, row + 1, start + 5, row + 1, end, "TOTAL", "columnHeader");
  });
  mergeVisual(rows, merges, row, 31, row + 1, 32, "TOTAL", "groupHeader");
  for (let participantIndex = 0; participantIndex < 4; participantIndex += 1) {
    const dataRow = row + 2 + participantIndex;
    const participantAttempts = participantIndex < 3
      ? attempts.filter((attempt) => attempt.coleadorIndex === participantIndex)
      : [];
    mergeVisual(rows, merges, dataRow, 2, dataRow, 9, participantAttempts[0]?.charro || "-", "participant");
    groups.forEach(([start, end], passIndex) => {
      const attempt = participantAttempts.find((item) => item.attemptIndex === passIndex);
      mergeVisual(rows, merges, dataRow, start, dataRow, start + 1, attempt ? attempt.goodPoints : "-", "scoreCell");
      mergeVisual(rows, merges, dataRow, start + 2, dataRow, start + 4, attempt ? attempt.individualBadPoints : "-", "badScoreCell");
      mergeVisual(rows, merges, dataRow, start + 5, dataRow, end, attempt ? attempt.total : "-", "totalCell");
    });
    mergeVisual(rows, merges, dataRow, 31, dataRow, 32, participantAttempts.length ? sumAttempts(participantAttempts) : "-", "totalCell");
  }
  mergeVisual(rows, merges, row + 6, 2, row + 6, 9, "SUPLENTE", "substitute");
  mergeVisual(rows, merges, row + 6, 10, row + 6, 12, "", "documentControl");
  mergeVisual(rows, merges, row + 6, 13, row + 6, 15, "SUMA\nCONTROL", "plainLabel");
  mergeVisual(rows, merges, row + 6, 16, row + 6, 18, section.total, "documentControl");
  mergeVisual(rows, merges, row + 6, 19, row + 6, 21, "", "documentControl");
  mergeVisual(rows, merges, row + 6, 22, row + 6, 24, "", "documentControl");
  mergeVisual(rows, merges, row + 7, 21, row + 7, 27, "INFRACCIÓN AL EQUIPO", "plainLabel");
  mergeVisual(rows, merges, row + 7, 28, row + 7, 32, sectionValueOrDash(section, "teamPenaltyTotal"), "controlBox");
  buildPostSectionControls(rows, merges, row + 8, accumulatedControl(snapshot, "coleadero"));
}

function buildJineteoVisual(rows, merges, section, row, title, kind, sideValue, control) {
  const attempt = section.attempts[0];
  mergeVisual(rows, merges, row, 1, row + 1, 1, sideValue, "documentControl");
  mergeVisual(rows, merges, row, 2, row, 9, title, "sectionTitle");
  mergeVisual(rows, merges, row + 1, 2, row + 1, 9, attempt?.charro || "", "participant");
  const labels = kind === "toro"
    ? ["BASE", "PRETAL\nDE GASA", "1\nMANO", "PIERNAS", "TENTE\nMOSO", "VERIJERO", "PRETAL", "CAERSE Y\nLEVANTARSE", "BAJARSE SIN\nSER LAZADO", "TOTAL", "MALOS", "T", "TOTAL"]
    : ["BASE", "PRETAL\nDE GASA", "PIERNAS", "1\nMANO", "TENTE\nMOSO", "VERIJERO", "PRETAL", "CAERSE Y\nLEVANTARSE", "BAJAR OREJA\nC/PIERN", "TOTAL", "MALOS", "T", "TOTAL"];
  const ranges = [[10, 10], [11, 12], [13, 14], [15, 16], [17, 18], [19, 20], [21, 22], [23, 24], [25, 26], [27, 27], [28, 29], [30, 30], [31, 32]];
  const values = jineteoScoreValues(attempt, kind);
  ranges.forEach(([start, end], index) => {
    mergeVisual(rows, merges, row, start, row, end, labels[index], index === 10 ? "badHeader" : "compactColumnHeader");
    mergeVisual(rows, merges, row + 1, start, row + 1, end, values[index], index === 10 ? "badScoreCell" : index === 12 ? "totalCell" : "scoreCell");
  });
  mergeVisual(rows, merges, row + 2, 2, row + 2, 9, "SUPLENTE", "substitute");
  mergeVisual(rows, merges, row + 2, 11, row + 2, 18, "TERMINADO EN", "plainLabel");
  mergeVisual(rows, merges, row + 2, 19, row + 2, 21, sectionTime(section), "controlBox");
  mergeVisual(rows, merges, row + 2, 22, row + 2, 23, "MIN.", "plainLabel");
  mergeVisual(rows, merges, row + 2, 24, row + 2, 28, "INFRACCIÓN AL EQUIPO", "plainLabel");
  mergeVisual(rows, merges, row + 2, 29, row + 2, 32, sectionValueOrDash(section, "teamPenaltyTotal"), "controlBox");
  buildPostSectionControls(rows, merges, row + 3, control);
}

function buildTernaVisual(rows, merges, snapshot, row, sideValue, control) {
  const section = snapshot.suertes.terna;
  const attempts = section.attempts || [];
  const participantRows = buildTernaParticipantRows(snapshot, attempts);
  mergeVisual(rows, merges, row, 1, row + 4, 1, sideValue, "documentControl");
  mergeVisual(rows, merges, row, 2, row, 9, "TERNA EN EL RUEDO", "sectionTitle");
  mergeVisual(rows, merges, row, 10, row, 17, "CABECERO · 5 OPORTUNIDADES", "groupHeader");
  mergeVisual(rows, merges, row, 18, row, 26, "PIAL", "groupHeader");
  mergeVisual(rows, merges, row, 27, row + 1, 28, "MALOS", "badHeader");
  mergeVisual(rows, merges, row, 29, row + 1, 29, "T", "groupHeader");
  mergeVisual(rows, merges, row, 30, row + 1, 32, "TOTAL", "groupHeader");
  mergeVisual(rows, merges, row + 1, 10, row + 1, 14, "BASE/ADICIONALES", "columnHeader");
  mergeVisual(rows, merges, row + 1, 15, row + 1, 17, "REMATE", "columnHeader");
  mergeVisual(rows, merges, row + 1, 18, row + 1, 22, "BASE/ADICIONALES", "columnHeader");
  mergeVisual(rows, merges, row + 1, 23, row + 1, 26, "REMATE", "columnHeader");
  for (let visualRow = 0; visualRow < 3; visualRow += 1) {
    const participant = participantRows[visualRow];
    const left = participant.left;
    const right = participant.right;
    const dataRow = row + 2 + visualRow;
    const fieldPrefix = `FMCH.TEAM_SHEET.TERNA.ROW_${String(visualRow + 1).padStart(2, "0")}`;
    mergeVisual(rows, merges, dataRow, 2, dataRow, 9, participant.name || "-", "participant", `FMCH.TEAM_SHEET.TERNA.PARTICIPANT_${String(visualRow + 1).padStart(2, "0")}.NAME`);
    mergeVisual(rows, merges, dataRow, 10, dataRow, 14, aggregateCountedTernaAttemptValue(left, attemptGoodExcludingTime), "scoreCell", `${fieldPrefix}.BASE_ADDITIONALES_01`);
    mergeVisual(rows, merges, dataRow, 15, dataRow, 17, aggregateRemate(left), "scoreCell", `${fieldPrefix}.REMATE_01`);
    mergeVisual(rows, merges, dataRow, 18, dataRow, 22, aggregateCountedTernaAttemptValue(right, attemptGoodExcludingTime), "scoreCell", `${fieldPrefix}.BASE_ADDITIONALES_02`);
    mergeVisual(rows, merges, dataRow, 23, dataRow, 26, aggregateRemate(right), "scoreCell", `${fieldPrefix}.REMATE_02`);
    mergeVisual(rows, merges, dataRow, 27, dataRow, 28, aggregateBoth(left, right, (attempt) => attempt.individualBadPoints), "badScoreCell", `${fieldPrefix}.MALOS`);
    mergeVisual(rows, merges, dataRow, 29, dataRow, 29, aggregateBoth(left, right, attemptTimePoints), "scoreCell", `${fieldPrefix}.T`);
    mergeVisual(rows, merges, dataRow, 30, dataRow, 32, aggregateBoth(left, right, (attempt) => attempt.total), "totalCell", `${fieldPrefix}.TOTAL`);
  }
  mergeVisual(rows, merges, row + 5, 2, row + 5, 9, "SUPLENTE", "substitute");
  mergeVisual(rows, merges, row + 5, 10, row + 5, 16, "TERMINADO EN", "plainLabel");
  mergeVisual(rows, merges, row + 5, 17, row + 5, 19, sectionTime(section), "controlBox");
  mergeVisual(rows, merges, row + 5, 20, row + 5, 21, "MIN.", "plainLabel");
  mergeVisual(rows, merges, row + 5, 22, row + 5, 28, "INFRACCIÓN AL EQUIPO", "plainLabel");
  mergeVisual(rows, merges, row + 5, 29, row + 5, 32, sectionValueOrDash(section, "teamPenaltyTotal"), "controlBox");
  buildPostSectionControls(rows, merges, row + 6, control);
}

function buildPasoVisual(rows, merges, section, row, sideValue, control) {
  const attempt = section.attempts[0];
  mergeVisual(rows, merges, row, 1, row + 2, 1, sideValue, "documentControl");
  mergeVisual(rows, merges, row, 2, row, 9, "PASO DE LA MUERTE", "sectionTitle");
  mergeVisual(rows, merges, row + 1, 2, row + 2, 9, attempt?.charro || "", "participant");
  mergeVisual(rows, merges, row, 10, row, 12, "1ra VUELTA", "groupHeader");
  mergeVisual(rows, merges, row, 13, row, 15, "2da VUELTA", "groupHeader");
  mergeVisual(rows, merges, row, 16, row, 27, "JINETEADA", "groupHeader");
  mergeVisual(rows, merges, row, 28, row, 30, "MALOS", "badHeader");
  mergeVisual(rows, merges, row, 31, row, 32, "TOTAL", "groupHeader");
  const labels = ["BASE", "BASE", "DISTANCIA", "CUARTA", "REPAROS", "OREJA C/P", "", ""];
  const ranges = [[10, 12], [13, 15], [16, 18], [19, 21], [22, 24], [25, 27], [28, 30], [31, 32]];
  const values = pasoScoreValues(attempt);
  ranges.forEach(([start, end], index) => {
    mergeVisual(rows, merges, row + 1, start, row + 1, end, labels[index], index === 6 ? "badHeader" : "columnHeader");
    mergeVisual(rows, merges, row + 2, start, row + 2, end, values[index], index === 6 ? "badScoreCell" : index === 7 ? "totalCell" : "scoreCell");
  });
  mergeVisual(rows, merges, row + 3, 2, row + 3, 9, "SUPLENTE", "substitute");
  mergeVisual(rows, merges, row + 3, 10, row + 3, 16, "TIEMPO EN SALIR", "plainLabel");
  mergeVisual(rows, merges, row + 3, 17, row + 3, 19, sectionTime(section), "controlBox");
  mergeVisual(rows, merges, row + 3, 20, row + 3, 21, "MIN.", "plainLabel");
  mergeVisual(rows, merges, row + 3, 22, row + 3, 28, "INFRACCIÓN AL EQUIPO", "plainLabel");
  mergeVisual(rows, merges, row + 3, 29, row + 3, 32, sectionValueOrDash(section, "teamPenaltyTotal"), "controlBox");
  buildPostSectionControls(rows, merges, row + 4, control);
}

function buildPostSectionControls(rows, merges, row, control) {
  mergeVisual(rows, merges, row, 22, row, 25, control?.previousTotal ?? "", "controlBox");
  mergeVisual(rows, merges, row, 26, row, 28, control?.currentSuerteTotal ?? "", "controlBox");
  mergeVisual(rows, merges, row, 29, row, 32, control?.newAccumulatedTotal ?? "", "controlBox");
}

function buildClosingVisual(rows, merges, snapshot, institutional, row) {
  mergeVisual(rows, merges, row, 2, row, 5, snapshot.badPoints.total, "totalCell");
  mergeVisual(rows, merges, row, 6, row, 12, "TOTAL, PUNTOS MALOS", "badHeader");
  mergeVisual(rows, merges, row + 1, 15, row + 1, 25, "PUNTUACIÓN FINAL", "finalLabel");
  mergeVisual(rows, merges, row + 1, 26, row + 1, 32, snapshot.finalScore, "finalScore");
  const signatures = snapshot.documentalControls.signatures || [];
  const signatureRanges = [[2, 9], [10, 17], [18, 25], [26, 32]];
  signatureRanges.forEach(([start, end], index) => {
    mergeVisual(rows, merges, row + 3, start, row + 3, end, signatures[index]?.label || "", "signatureLabel");
    mergeVisual(rows, merges, row + 4, start, row + 4, end, "", "signatureLine");
  });
  mergeVisual(rows, merges, row + 5, 6, row + 5, 13, "", "footer");
  mergeVisual(rows, merges, row + 5, 14, row + 5, 32, institutional.sportsSecretariatPeriod, "footerRed");
  mergeVisual(rows, merges, row + 6, 6, row + 7, 32, `“${institutional.institutionalQuote}”`, "footerRed");
}

function headerField(rows, merges, row, labelStart, labelEnd, label, valueStart, valueEnd, value) {
  mergeVisual(rows, merges, row, labelStart, row, labelEnd, label, "plainLabel");
  mergeVisual(rows, merges, row, valueStart, row, valueEnd, value || "", "headerValue");
}

function mergeVisual(rows, merges, startRow, startCol, endRow, endCol, value, style, fieldId = "") {
  for (let row = startRow; row <= endRow; row += 1) {
    for (let col = startCol; col <= endCol; col += 1) putVisual(rows, row, col, "", style);
  }
  putVisual(rows, startRow, startCol, value, style, fieldId);
  if (startRow !== endRow || startCol !== endCol) merges.push(`${columnName(startCol)}${startRow}:${columnName(endCol)}${endRow}`);
}

function putVisual(rows, row, col, value, style, fieldId = "") {
  rows[row - 1][col - 1] = C(value ?? "", style, fieldId);
}

function calaDistanceHeading(attempt) {
  const detail = calculationItems(attempt?.calculationDetail).find((item) => item?.type === "cala_punta");
  const meters = finiteOrBlank(detail?.details?.metrosCalificados ?? detail?.details?.metros);
  const times = finiteOrBlank(detail?.details?.piquetes);
  return `${meters === "" ? "_____" : meters} METROS EN ${times === "" ? "_____" : times} TIEMPOS`;
}

function calaScoreValues(attempt) {
  if (!attempt) return Array(8).fill("");
  const cala = attempt.documentalEvidence?.cala;
  return [
    finiteOrBlank(attempt.baseSelection?.total),
    finiteOrBlank(cala?.puntaDistancePoints),
    finiteOrBlank(cala?.puntaTimePoints),
    selectionTotalOrZero(attempt.additionalSelections, /lado_derecho/),
    selectionTotalOrZero(attempt.additionalSelections, /lado_izquierdo/),
    selectionTotalOrZero(attempt.additionalSelections, /medio_derecho/),
    selectionTotalOrZero(attempt.additionalSelections, /medio_izquierdo/),
    selectionTotalOrZero(attempt.additionalSelections, /cambio_rectangulo/)
  ];
}

function jineteoScoreValues(attempt, kind) {
  if (!attempt) return Array(13).fill("");
  const additional = attempt.additionalSelections || [];
  const oneHandIndex = kind === "toro" ? 2 : 3;
  const legsIndex = kind === "toro" ? 3 : 2;
  const values = Array(13).fill("");
  values[0] = finiteOrBlank(attempt.baseSelection?.total);
  values[1] = selectionTotalByRuleIds(additional, [`${kind}_adic_pretal_gaza_dos_manos`]);
  values[oneHandIndex] = selectionTotalByRuleIds(additional, [`${kind}_adic_una_mano`]);
  values[legsIndex] = selectionTotalByRuleIds(additional, [`${kind}_adic_jugar_piernas`]);
  values[4] = selectionTotalByRuleIds(additional, [`${kind}_adic_tentemozo`]);
  values[5] = selectionTotalByRuleIds(additional, [`${kind}_adic_quitar_verijero`]);
  values[6] = selectionTotalByRuleIds(additional, [`${kind}_adic_quitar_gaza_tentemozo`]);
  values[7] = selectionTotalByRuleIds(additional, [`${kind}_adic_levanta_sin_ayuda`, `${kind}_adic_levanta_con_ayuda`]);
  values[8] = selectionTotalByRuleIds(additional, [kind === "toro" ? "toro_adic_bajar_sin_lazo" : "yegua_adic_oreja_cruzar_pierna"]);
  values[9] = attemptGoodExcludingTime(attempt);
  values[10] = attempt.individualBadPoints;
  values[11] = attemptTimePoints(attempt);
  values[12] = attempt.total;
  return values;
}

function calaBadPointCode(item) {
  return String(item?.documentCode || "").trim() || "-";
}

function buildTernaParticipantRows(snapshot, attempts) {
  const roster = Array.isArray(snapshot.teamMetadata?.roster?.terna)
    ? snapshot.teamMetadata.roster.terna.slice(0, 3).map(normalizeTernaRosterParticipant)
    : [];
  while (roster.length < 3) roster.push({ participantId: "", name: "" });
  const rows = roster.slice(0, 3).map((participant) => ({ ...participant, left: [], right: [] }));

  for (const attempt of attempts) {
    const rowIndex = resolveTernaParticipantRow(rows, attempt);
    if (rowIndex < 0) continue;
    if (attempt.suerteId === "lazo") rows[rowIndex].left.push(attempt);
    if (attempt.suerteId === "pial_ruedo") rows[rowIndex].right.push(attempt);
  }
  return rows;
}

function normalizeTernaRosterParticipant(value) {
  if (value && typeof value === "object") {
    return {
      participantId: String(value.participantId || value.id || "").trim(),
      name: String(value.name || value.participantName || "").trim()
    };
  }
  return { participantId: "", name: String(value || "").trim() };
}

function resolveTernaParticipantRow(rows, attempt) {
  const participantId = String(attempt?.participantId || "").trim();
  if (participantId) {
    const identityRow = rows.findIndex((row) => row.participantId && row.participantId === participantId);
    if (identityRow >= 0) return identityRow;
    if (Number.isInteger(attempt?.participantSlot) && attempt.participantSlot >= 0 && attempt.participantSlot < rows.length) {
      return attempt.participantSlot;
    }
  }
  const normalizedName = normalizeParticipantName(attemptCharro(attempt));
  return normalizedName
    ? rows.findIndex((row) => normalizeParticipantName(row.name) === normalizedName)
    : -1;
}

function attemptCharro(attempt) {
  return String(attempt?.charro || "").trim();
}

function normalizeParticipantName(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function aggregateAttemptValue(attempts, selector) {
  return attempts.length ? attempts.reduce((sum, attempt) => sum + finite(selector(attempt)), 0) : "-";
}

function aggregateCountedTernaAttemptValue(attempts, selector) {
  return aggregateAttemptValue(attempts.filter(isCountedTernaAttempt), selector);
}

function aggregateBoth(left, right, selector) {
  const attempts = [...left, ...right];
  return aggregateAttemptValue(attempts, selector);
}

function aggregateRemate(attempts) {
  const countedAttempts = attempts.filter(isCountedTernaAttempt);
  if (!countedAttempts.length) return "-";
  const labels = countedAttempts.map(attemptRemate).filter(Boolean);
  return labels.length ? [...new Set(labels)].join(" / ") : "-";
}

function isCountedTernaAttempt(attempt) {
  const status = String(attempt?.sportStatus || attempt?.sportState?.status || "").trim().toUpperCase();
  const result = String(attempt?.sportState?.result || "").trim().toUpperCase();
  if (["DQ", "NOT_ACHIEVED", "ZERO", "LOST_OPPORTUNITY"].includes(status) || result === "NOT_ACHIEVED") {
    return false;
  }
  return Boolean(attempt?.baseSelection?.selectedRuleId);
}

function sectionValueOrDash(section, key) {
  return section?.attempts?.length ? finite(section[key]) : "-";
}

function attemptTimePoints(attempt) {
  return finite(attempt?.documentalEvidence?.timePoints?.value);
}

function sectionTimePoints(section) {
  return (section?.attempts || []).reduce((sum, attempt) => sum + attemptTimePoints(attempt), 0);
}

function attemptGoodExcludingTime(attempt) {
  return finite(attempt?.goodPoints) - attemptTimePoints(attempt);
}

function attemptNetExcludingTime(attempt) {
  return finite(attempt?.total) - attemptTimePoints(attempt);
}

function accumulatedControl(snapshot, sectionId) {
  return snapshot?.documentalControls?.accumulatedBySection?.[sectionId] || null;
}

function selectionTotalByRuleIds(items, ruleIds) {
  const allowed = new Set(ruleIds);
  return (items || []).reduce((sum, item) => {
    const ruleId = String(item?.selectedRuleId || item?.ruleId || item?.id || "");
    return allowed.has(ruleId) ? sum + finite(item.total ?? item.resolvedValue ?? item.value) : sum;
  }, 0);
}

function pasoScoreValues(attempt) {
  if (!attempt) return Array(8).fill("");
  const paso = attempt.documentalEvidence?.paso;
  return [
    finiteOrBlank(paso?.firstLapBase),
    finiteOrBlank(paso?.secondLapBase),
    selectionTotal(attempt.additionalSelections, /distancia/),
    selectionTotal(attempt.additionalSelections, /cuartear|cuarta/),
    selectionTotal(attempt.additionalSelections, /levantar|reparo/),
    selectionTotal(attempt.additionalSelections, /oreja|pierna|apearse/),
    attempt.individualBadPoints,
    attempt.total
  ];
}

function attemptRemate(attempt) {
  return attempt?.documentalEvidence?.remate?.remateLabel || "";
}

function sectionTime(section) {
  const values = (section?.attempts || []).map((attempt) =>
    attempt?.documentalEvidence?.officialTime?.formatted || ""
  ).filter(Boolean);
  return values.at(-1) || "";
}

function badPointsControlValue(snapshot, sectionId) {
  return snapshot.documentalControls?.badPointsBySection?.[sectionId]?.value ?? "";
}

function selectionTotal(selections, pattern) {
  const matches = (selections || []).filter((selection) => pattern.test(selectionId(selection)));
  return matches.length ? matches.reduce((sum, selection) => sum + selectionPoints(selection), 0) : "";
}

function selectionTotalOrZero(selections, pattern) {
  const value = selectionTotal(selections, pattern);
  return value === "" ? 0 : value;
}

function selectionId(selection) {
  return String(selection?.selectedRuleId || selection?.ruleId || selection?.id || "").toLowerCase();
}

function selectionPoints(selection) {
  return finite(selection?.total ?? selection?.resolvedValue ?? selection?.value);
}

function sumAttempts(attempts) {
  return attempts.reduce((sum, attempt) => sum + finite(attempt?.total), 0);
}

function finiteOrBlank(value) {
  if (value === null || value === undefined || value === "") return "";
  const number = Number(value);
  return Number.isFinite(number) ? number : "";
}

function calculationItems(value) {
  if (Array.isArray(value)) return value;
  return value && typeof value === "object" ? [value] : [];
}

function ordinalSuffix(value) {
  return value === 1 ? "er" : value === 2 ? "do" : "er";
}

function columnName(colNumber) {
  let name = "";
  let current = colNumber;
  while (current > 0) {
    const remainder = (current - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    current = Math.floor((current - 1) / 26);
  }
  return name;
}

function describeFrozenAttempt(attempt) {
  const labels = [];
  if (attempt.baseSelection?.label) labels.push(attempt.baseSelection.label);
  for (const selection of attempt.additionalSelections || []) if (selection.label) labels.push(`+ ${selection.label}`);
  for (const selection of attempt.infractions || []) if (selection.label) labels.push(`- ${selection.label}`);
  if (attempt.classification?.classificationLabel) labels.push(`CLAS: ${attempt.classification.classificationLabel}`);
  if (attempt.sportStatus) labels.push(`ESTADO: ${attempt.sportStatus}`);
  if (attempt.note) labels.push(`NOTA: ${attempt.note}`);
  return labels.join("; ");
}

function sumSelectionTotals(selections) {
  return (selections || []).reduce((sum, selection) => sum + finite(selection.total), 0);
}

function normalizePackageOptions(input) {
  if (typeof input === "string") return { charreadaId: input };
  return input && typeof input === "object" ? { ...input } : {};
}

function compactTournament(tournament) {
  return {
    id: tournament.id || "",
    name: tournament.name || "",
    date: tournament.date || "",
    venue: tournament.venue || ""
  };
}

function compactCharreada(charreada) {
  return {
    id: charreada.id || "",
    tournamentId: charreada.tournamentId || "",
    name: charreada.name || "",
    date: charreada.date || "",
    startTime: charreada.startTime || "",
    status: charreada.status || ""
  };
}

function C(value, style, fieldId = "") {
  return fieldId ? { value, style, fieldId } : { value, style };
}

function D(value, documentFieldId, documentRole) {
  return { value, documentFieldId, documentRole };
}

function safeSheetName(name) {
  return String(name || "Equipo").replace(/[\\/?*[\]:]/g, " ").slice(0, 31).trim() || "Equipo";
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

function slug(value) {
  return String(value || "charreada")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function finite(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}
