# Paper And Rendering Authority

## Fuente

- Documento: `Reglamento-Oficial-Charros-Libre-y-Juvenil-24-28-VF2-2026.pdf`.
- SHA-256: `3a14fe3d6add5add76033765b27227c44f04c8e31330ce4aeb3248828701dca7`.
- Pagina fuente: `612 x 965.04 pt`.
- Dimension equivalente: `8.5 x 13.403333 in`.
- Dimension declarada: `215.9 x 340.44 mm`.
- Orientacion: vertical.

La dimension se conserva como papel personalizado porque no coincide exactamente con Letter, Legal ni Folio. El XLSX emite `paperWidth` y `paperHeight`; el CSS de impresion usa las mismas dimensiones.

## Separacion de renderers

Los anchos de columnas XLSX permanecen en unidades de hoja de calculo. El renderer HTML los normaliza a porcentajes acotados y no aplica alturas XLSX como pixeles CSS. La tabla web utiliza `table-layout: fixed`, `min-width: 0` en celdas y un documento con ancho maximo de `1120px`.

## Gate visual

La evidencia final se convirtio desde el XLSX con LibreOffice. El PDF resultante conserva una sola pagina de `612 x 965.055 pt`, sin cortes, y mantiene visibles logos, Cala, Terna, Jineteos, controles, puntuacion final y cuatro campos manuales de firma.
