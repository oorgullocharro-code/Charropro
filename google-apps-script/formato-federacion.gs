/**
 * CharroPro -> Google Sheets
 * Recibe el paquete `formatoFederacion` y crea una hoja por equipo.
 *
 * Pasos:
 * 1. Abre tu Google Sheet.
 * 2. Extensiones > Apps Script.
 * 3. Pega este archivo completo.
 * 4. Implementar > Nueva implementacion > Aplicacion web.
 * 5. Ejecutar como: Yo.
 * 6. Quien tiene acceso: Cualquier usuario con el enlace.
 * 7. Copia la URL del Web App y pegala en CharroPro > Conexion.
 */

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || "{}");
    storeLivePayload(payload);
    const official = payload.formatoFederacion;

    if (!official || !Array.isArray(official.sheets)) {
      return jsonResponse({ ok: false, error: "No llego formatoFederacion." });
    }

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

    official.sheets.forEach((teamSheet) => {
      writeTeamSheet(spreadsheet, official, teamSheet);
    });

    writeLiveSummary(spreadsheet, payload, official);

    return jsonResponse({
      ok: true,
      format: official.format,
      sheets: official.sheets.length,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message });
  }
}

function doGet(e) {
  try {
    const live = getStoredLivePayload();
    return liveResponse(e, live || { ok: false, error: "Sin estado vivo guardado." });
  } catch (error) {
    return liveResponse(e, { ok: false, error: error.message });
  }
}

function storeLivePayload(payload) {
  const livePayload = {
    ok: true,
    updatedAt: new Date().toISOString(),
    payload: payload
  };
  const raw = JSON.stringify(livePayload);

  CacheService.getScriptCache().put("charropro_live_payload", raw, 21600);
  PropertiesService.getScriptProperties().setProperty("charropro_live_payload", raw);
}

function getStoredLivePayload() {
  const raw = CacheService.getScriptCache().get("charropro_live_payload") ||
    PropertiesService.getScriptProperties().getProperty("charropro_live_payload");
  return raw ? JSON.parse(raw) : null;
}

function liveResponse(e, data) {
  const callback = e && e.parameter ? e.parameter.callback : "";
  if (callback && /^[A-Za-z_$][0-9A-Za-z_$]*$/.test(callback)) {
    return ContentService
      .createTextOutput(callback + "(" + JSON.stringify(data) + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return jsonResponse(data);
}

function writeTeamSheet(spreadsheet, official, teamSheet) {
  const sheetName = cleanSheetName(teamSheet.sheetName || teamSheet.teamName || "Equipo");
  const sheet = spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);
  const rows = normalizeRows(teamSheet.visualRows || teamSheet.rows || []);
  const columnCount = Math.max.apply(null, rows.map((row) => row.length));

  sheet.clear();

  if (!rows.length || !columnCount) return;

  sheet.getRange(1, 1, rows.length, columnCount).setValues(
    rows.map((row) => padRow(row, columnCount))
  );

  applyVisualSizing(sheet, teamSheet, rows.length, columnCount);

  (teamSheet.visualMerges || []).forEach((rangeA1) => {
    try {
      sheet.getRange(rangeA1).merge();
    } catch (error) {
      // Algunas plataformas rechazan rangos ya combinados; la hoja fue limpiada, asi que se ignora.
    }
  });

  sheet.setFrozenRows(5);
  sheet.getRange(1, 1, 1, columnCount).mergeAcross();
  sheet.getRange(1, 1, 1, columnCount)
    .setFontWeight("bold")
    .setFontSize(14)
    .setHorizontalAlignment("center")
    .setBackground("#ffffff")
    .setFontColor("#38761d");

  sheet.getRange(2, 1, rows.length - 1, columnCount)
    .setFontFamily("Arial")
    .setFontSize(9)
    .setVerticalAlignment("middle")
    .setWrap(true);

  paintSectionRows(sheet, rows, columnCount);
  paintCalaMalosGrid(sheet, rows, columnCount);
  paintScoreControlRows(sheet, rows, columnCount);
  if (!teamSheet.visualWidths || !teamSheet.visualWidths.length) {
    sheet.autoResizeColumns(1, Math.min(columnCount, 12));
  }

  const lastRow = rows.length;
  sheet.getRange(lastRow - 2, 1, 2, 2)
    .setFontWeight("bold")
    .setBackground("#eeeeee")
    .setFontColor("#cc0000");
}

function applyVisualSizing(sheet, teamSheet, rowCount, columnCount) {
  const widths = teamSheet.visualWidths || [];
  widths.slice(0, columnCount).forEach((width, index) => {
    const pixels = Math.max(34, Math.min(180, Math.round(Number(width || 12) * 7)));
    sheet.setColumnWidth(index + 1, pixels);
  });

  const heights = teamSheet.visualRowHeights || [];
  heights.slice(0, rowCount).forEach((height, index) => {
    sheet.setRowHeight(index + 1, Math.max(16, Math.min(48, Math.round(Number(height || 21) * 1.15))));
  });
}

function writeLiveSummary(spreadsheet, payload, official) {
  const sheet = spreadsheet.getSheetByName("EN_VIVO") || spreadsheet.insertSheet("EN_VIVO");
  const turn = payload.turn || {};
  const timer = payload.timer || {};
  const leaderboard = payload.leaderboard || [];
  const rows = [
    ["Actualizado", new Date()],
    ["Formato", official.format || ""],
    ["Torneo", official.tournament ? official.tournament.name : ""],
    ["Charreada", official.charreada ? official.charreada.name : ""],
    ["Equipo en turno", turn.team ? turn.team.name : ""],
    ["Suerte", turn.suerte ? turn.suerte.fullName : ""],
    ["Charro", turn.charro || ""],
    ["Oportunidad", Number(turn.attemptIndex || 0) + 1],
    ["Cronometro activo", timer.running ? "SI" : "NO"],
    ["Cronometro inicio", timer.startedAt || ""],
    ["Cronometro base ms", Number(timer.elapsedMs || 0)],
    ["Cronometro texto", timer.formatted || "00:00.0"],
    [],
    ["Tabla", "Equipo", "Puntos", "Malos"]
  ];

  leaderboard.forEach((item, index) => {
    rows.push([index + 1, item.team ? item.team.name : "", item.total || 0, item.infr || 0]);
  });

  const columnCount = Math.max.apply(null, rows.map((row) => row.length));
  sheet.clear();
  sheet.getRange(1, 1, rows.length, columnCount).setValues(
    rows.map((row) => padRow(row, columnCount))
  );
  sheet.getRange(1, 1, 1, columnCount).setFontWeight("bold");
  sheet.autoResizeColumns(1, columnCount);
}

function paintSectionRows(sheet, rows, columnCount) {
  const sectionNames = [
    "CALA DE CABALLO",
    "PIALES EN EL LIENZO",
    "COLEADERO",
    "JINETEO DE TORO",
    "TERNA EN EL RUEDO",
    "JINETEO DE YEGUA",
    "MANGANAS A PIE",
    "MANGANAS A CABALLO",
    "PASO DE LA MUERTE"
  ];

  rows.forEach((row, index) => {
    if (sectionNames.indexOf(row[0]) === -1) return;
    sheet.getRange(index + 1, 1, 1, columnCount)
      .setFontWeight("bold")
      .setBackground("#dddddd")
      .setFontColor("#000000");
  });
}

function paintCalaMalosGrid(sheet, rows, columnCount) {
  if (columnCount < 22) return;

  rows.forEach((row, index) => {
    if (row[0] !== "CALA DE CABALLO") return;
    const startRow = index + 1;
    sheet.getRange(startRow, 12, 1, 10)
      .setFontColor("#cc0000")
      .setFontWeight("bold")
      .setHorizontalAlignment("center")
      .setBackground("#f4cccc");
    sheet.getRange(startRow + 1, 12, 2, 10)
      .setFontColor("#cc0000")
      .setFontWeight("bold")
      .setHorizontalAlignment("center")
      .setBorder(true, true, true, true, true, true, "#000000", SpreadsheetApp.BorderStyle.SOLID);
    sheet.getRange(startRow + 2, 22, 1, Math.min(2, columnCount - 21))
      .setFontWeight("bold")
      .setHorizontalAlignment("center");
  });
}

function paintScoreControlRows(sheet, rows, columnCount) {
  rows.forEach((row, index) => {
    const hasAccumulator = row.some((cell) => String(cell || "").indexOf("ACUMULADO") !== -1);
    if (!hasAccumulator) return;

    sheet.getRange(index + 1, 13, 1, Math.min(7, columnCount - 12))
      .setFontWeight("bold")
      .setHorizontalAlignment("center")
      .setBackground("#fff200")
      .setBorder(true, true, true, true, true, true, "#000000", SpreadsheetApp.BorderStyle.SOLID);
  });
}

function normalizeRows(rows) {
  return rows.map((row) => {
    const normalized = Array.isArray(row) ? row : [row];
    return normalized.map((cell) => {
      if (cell && typeof cell === "object" && Object.prototype.hasOwnProperty.call(cell, "value")) {
        return cell.value;
      }
      return cell;
    });
  });
}

function padRow(row, columnCount) {
  const output = row.slice();
  while (output.length < columnCount) output.push("");
  return output;
}

function cleanSheetName(name) {
  return String(name || "Equipo")
    .replace(/[\\/?*[\]:]/g, " ")
    .substring(0, 31)
    .trim() || "Equipo";
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
