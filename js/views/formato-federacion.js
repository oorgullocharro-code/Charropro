import { escapeHTML, html, moneylessNumber } from "../core/dom.js?v=20260829-official-timer-overtime-rtdb-rules-compatibility-001-v1";
import { buildOfficialPackage, downloadOfficialFormatXlsx } from "../core/officialFormat.js?v=20260829-official-timer-overtime-rtdb-rules-compatibility-001-v1";
import { renderOfficialFormatSheetHtml } from "../core/officialFormatHtml.js?v=20260829-official-timer-overtime-rtdb-rules-compatibility-001-v1";
import { loadState, subscribeToLiveUpdates } from "../core/state.js?v=20260829-official-timer-overtime-rtdb-rules-compatibility-001-v1";

const root = document.getElementById("official-format-root");
const pageParams = new URLSearchParams(window.location.search);
const tournamentId = pageParams.get("tournamentId") || "";
const charreadaId = pageParams.get("charreadaId") || "";
let selectedTeamId = pageParams.get("team") || "";
document.body.classList.add("official-format-body");

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
    downloadOfficialFormatXlsx({ tournamentId, charreadaId });
  }

  if (target.dataset.action === "print-official-sheet") {
    window.print();
  }
});

function render() {
  loadState();
  const official = buildOfficialPackage({ tournamentId, charreadaId });
  const sheets = official.sheets || [];

  if (!tournamentId || !charreadaId || !sheets.length) {
    root.innerHTML = html`
      <main class="official-page">
        <div class="official-toolbar">
          <a class="button" href="./index.html">Volver</a>
        </div>
        <div class="empty">
          <h1>Hoja Federacion</h1>
          <p>Abre la hoja desde una charreada especifica para conservar el contexto historico oficial.</p>
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
        ${renderOfficialFormatSheetHtml(selectedSheet)}
      </section>
    </main>
  `;
}
