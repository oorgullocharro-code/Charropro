export function renderOfficialFormatSheetHtml(sheet, options = {}) {
  const rows = sheet?.visualRows || sheet?.rows || [];
  const mergeInfo = buildMergeInfo(sheet?.visualMerges || []);
  const widths = sheet?.visualWidths || [];
  const columnRoles = sheet?.visualColumnRoles || [];
  const rowRoles = sheet?.visualRowRoles || [];
  const rowHeights = sheet?.visualWebRowHeights || [];
  const webColumnWidths = buildWebColumnWidths(rows, widths);
  const institutional = sheet?.institutional || {};
  const assetBasePath = normalizeAssetBasePath(options.assetBasePath);

  return `
    <article class="official-document">
      <header class="official-institutional-header">
        <img
          src="${escapeHTML(joinAssetPath(assetBasePath, institutional.federationLogo?.path))}"
          alt="Emblema de la Federación Mexicana de Charrería"
        >
        <strong>FEDERACIÓN MEXICANA DE CHARRERÍA, A.C.</strong>
      </header>
      <table class="official-sheet">
        <colgroup>
          ${webColumnWidths.map((width, index) => {
            const role = safeCssToken(columnRoles[index] || "score");
            return `<col class="official-column-${role}" style="width:${width}%">`;
          }).join("")}
        </colgroup>
        <tbody>
          ${rows.map((row, rowIndex) => renderRow(row, rowIndex, {
            mergeInfo,
            role: rowRoles[rowIndex],
            height: rowHeights[rowIndex]
          })).join("")}
        </tbody>
      </table>
      <footer class="official-institutional-footer">
        <img
          src="${escapeHTML(joinAssetPath(assetBasePath, institutional.conadeLogo?.path))}"
          alt="${escapeHTML(institutional.conadeName || "CONADE")}"
        >
        <div>
          <p>${escapeHTML(institutional.sportsSecretariatPeriod || "")}</p>
          <strong>${escapeHTML(institutional.institutionalQuote || "")}</strong>
        </div>
      </footer>
    </article>
  `;
}

export function renderOfficialFormatStandaloneHtml(sheet, options = {}) {
  const title = options.title || sheet?.teamName || "Formato Federación";
  const stylesheetHref = options.stylesheetHref || "./css/styles.css";
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHTML(title)}</title>
  <link rel="stylesheet" href="${escapeHTML(stylesheetHref)}">
</head>
<body class="official-format-body">
  <main class="official-page">
    <section class="official-sheet-wrap">
      ${renderOfficialFormatSheetHtml(sheet, options)}
    </section>
  </main>
</body>
</html>
`.replace(/[ \t]+$/gm, "");
}

function renderRow(row, rowIndex, context) {
  const role = safeCssToken(context.role || "scoring-value");
  const height = Number(context.height);
  const rowStyle = Number.isFinite(height) && height > 0
    ? ` style="--official-row-height:${height}px"`
    : "";
  return `
    <tr class="official-row official-row-${role}"${rowStyle} data-row-role="${role}">
      ${row.map((cell, colIndex) => renderCell(cell, rowIndex, colIndex, context.mergeInfo)).join("")}
    </tr>
  `;
}

function buildWebColumnWidths(rows, spreadsheetWidths) {
  const count = Math.max(...rows.map((row) => row.length), spreadsheetWidths.length, 1);
  const weights = Array.from({ length: count }, (_, index) => {
    const value = Number(spreadsheetWidths[index]);
    return Number.isFinite(value) && value > 0 ? Math.min(value, 12) : 3;
  });
  const total = weights.reduce((sum, value) => sum + value, 0) || count;
  return weights.map((value) => Number(((value / total) * 100).toFixed(4)));
}

function renderCell(cell, rowIndex, colIndex, mergeInfo) {
  const skipKey = cellKey(rowIndex, colIndex);
  if (mergeInfo.skip.has(skipKey)) return "";

  const merge = mergeInfo.starts.get(skipKey);
  const value = getCellValue(cell);
  const style = getCellStyle(cell);
  const attrs = [
    merge?.rowspan > 1 ? `rowspan="${merge.rowspan}"` : "",
    merge?.colspan > 1 ? `colspan="${merge.colspan}"` : ""
  ].filter(Boolean).join(" ");

  return `<td class="${escapeHTML(style ? `official-${style}` : "")}"${attrs ? ` ${attrs}` : ""}>${escapeHTML(value)}</td>`;
}

function getCellValue(cell) {
  if (cell && typeof cell === "object" && !Array.isArray(cell) && "value" in cell) return cell.value ?? "";
  return cell ?? "";
}

function getCellStyle(cell) {
  if (cell && typeof cell === "object" && !Array.isArray(cell) && "style" in cell) return String(cell.style || "");
  return "";
}

function buildMergeInfo(merges) {
  const starts = new Map();
  const skip = new Set();

  merges.forEach((merge) => {
    const [startRef, endRef] = String(merge || "").split(":");
    const start = parseCellRef(startRef);
    const end = parseCellRef(endRef);
    if (!start || !end) return;

    const rowspan = end.row - start.row + 1;
    const colspan = end.col - start.col + 1;
    starts.set(cellKey(start.row, start.col), { rowspan, colspan });

    for (let row = start.row; row <= end.row; row += 1) {
      for (let col = start.col; col <= end.col; col += 1) {
        if (row === start.row && col === start.col) continue;
        skip.add(cellKey(row, col));
      }
    }
  });

  return { starts, skip };
}

function parseCellRef(ref) {
  const match = String(ref || "").match(/^([A-Z]+)(\d+)$/i);
  if (!match) return null;
  return {
    col: lettersToIndex(match[1]) - 1,
    row: Number(match[2]) - 1
  };
}

function lettersToIndex(letters) {
  return String(letters || "").toUpperCase().split("").reduce((sum, letter) => {
    return sum * 26 + letter.charCodeAt(0) - 64;
  }, 0);
}

function cellKey(row, col) {
  return `${row}:${col}`;
}

function safeCssToken(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/(^-|-$)/g, "") || "plain";
}

function normalizeAssetBasePath(value) {
  const normalized = String(value ?? "./").trim();
  if (!normalized) return "";
  return normalized.endsWith("/") ? normalized : `${normalized}/`;
}

function joinAssetPath(basePath, assetPath) {
  const path = String(assetPath || "").replace(/^\.\//, "");
  return path ? `${basePath}${path}` : "";
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}
