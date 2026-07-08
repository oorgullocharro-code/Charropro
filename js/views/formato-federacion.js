import { escapeHTML, html, moneylessNumber } from "../core/dom.js?v=20260708-recovery-001b-panel-status1";
import { buildOfficialPackage, downloadOfficialFormatXlsx } from "../core/officialFormat.js?v=20260708-recovery-001b-panel-status1";
import { getActiveCharreada, loadState, state, subscribeToLiveUpdates } from "../core/state.js?v=20260708-recovery-001b-panel-status1";

const root = document.getElementById("official-format-root");
let selectedTeamId = new URLSearchParams(window.location.search).get("team") || "";

loadState();
render();
subscribeToLiveUpdates(render);

document.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  event.preventDefault();

  if (target.dataset.action === "select-official-team") {
    selectedTeamId = target.dataset.teamId || "";
    render();
  }

  if (target.dataset.action === "download-official-xlsx") {
    downloadOfficialFormatXlsx(state.activeCharreadaId);
  }

  if (target.dataset.action === "print-official-sheet") {
    window.print();
  }
});

function render() {
  loadState();
  const charreada = getActiveCharreada();
  const official = buildOfficialPackage(state.activeCharreadaId);
  const sheets = official.sheets || [];

  if (!charreada || !sheets.length) {
    root.innerHTML = html`
      <main class="official-page">
        <div class="official-toolbar">
          <a class="button" href="./index.html">Volver</a>
        </div>
        <div class="empty">
          <h1>Hoja Federacion</h1>
          <p>No hay una charreada activa con equipos para mostrar.</p>
        </div>
      </main>
    `;
    return;
  }

  const selectedSheet = sheets.find((sheet) => sheet.teamId === selectedTeamId) || sheets[0];
  selectedTeamId = selectedSheet.teamId;

  root.innerHTML = html`
    <main class="official-page">
      <div class="official-toolbar">
        <div>
          <p>Hoja de calificacion</p>
          <h1>${escapeHTML(official.charreada?.name || "Charreada")}</h1>
        </div>
        <div class="official-toolbar-actions">
          <a class="button" href="./index.html">Volver</a>
          <button class="button" data-action="print-official-sheet">Imprimir</button>
          <button class="button primary" data-action="download-official-xlsx">Descargar Excel</button>
        </div>
      </div>

      <nav class="official-team-tabs">
        ${sheets.map((sheet, index) => html`
          <button
            class="button small ${sheet.teamId === selectedSheet.teamId ? "primary" : ""}"
            data-action="select-official-team"
            data-team-id="${escapeHTML(sheet.teamId)}"
          >
            ${index + 1}. ${escapeHTML(sheet.teamName)}
            <span>${moneylessNumber(sheet.puntuacionFinal)} pts</span>
          </button>
        `).join("")}
      </nav>

      <section class="official-sheet-wrap">
        ${renderSheet(selectedSheet)}
      </section>
    </main>
  `;
}

function renderSheet(sheet) {
  const rows = sheet.visualRows || sheet.rows || [];
  const mergeInfo = buildMergeInfo(sheet.visualMerges || []);
  const widths = sheet.visualWidths || [];

  return html`
    <table class="official-sheet">
      <colgroup>
        ${Array.from({ length: Math.max(...rows.map((row) => row.length), widths.length, 1) }, (_, index) => {
          const width = Math.max(28, Number(widths[index] || 12) * 7);
          return html`<col style="width:${width}px">`;
        }).join("")}
      </colgroup>
      <tbody>
        ${rows.map((row, rowIndex) => html`
          <tr style="height:${Number(sheet.visualRowHeights?.[rowIndex] || 22)}px">
            ${row.map((cell, colIndex) => renderCell(cell, rowIndex, colIndex, mergeInfo)).join("")}
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
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

  return html`
    <td class="${escapeHTML(style ? `official-${style}` : "")}" ${attrs}>
      ${escapeHTML(value)}
    </td>
  `;
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
