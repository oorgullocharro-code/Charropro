# Current Repository References

This is a non-invasive file inventory only. It does not map FMCH fields to CharroPro fields and does not assert compliance.

| File | Observed role |
| --- | --- |
| `js/core/officialFormat.js` | Declares `OFFICIAL_FORMAT_NAME`; builds package, per-team sheet rows, visual layout, XLSX download |
| `js/core/exporters.js` | General CSV and backup JSON export utilities |
| `js/core/xlsx.js` | Browser XLSX workbook construction utility |
| `js/views/formato-federacion.js` | Browser view/print and XLSX download trigger for official-format package |
| `formato-federacion.html` | Existing HTML entry point for the federation-format view |
| `js/core/sync.js` | Builds a live payload that includes `formatoFederacion` |
| `google-apps-script/formato-federacion.gs` | Google Sheets receiver/writer for the package |
| `google-apps-script/formato-federacion-visual.gs` | Google Apps Script visual skeleton and sheet writer |
| `README.md` | Documents federation format, XLSX, and Google Sheets integration |

Observed tests use related sports formatting indirectly, including `tests/cala-rules.test.mjs` and `tests/team-penalties-zero.test.mjs`. No new mapping, exporter comparison, or compliance conclusion was performed.
