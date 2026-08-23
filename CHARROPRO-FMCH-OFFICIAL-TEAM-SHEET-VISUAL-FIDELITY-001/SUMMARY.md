# CHARROPRO-FMCH-OFFICIAL-TEAM-SHEET-VISUAL-FIDELITY-001

## Resultado

El Formato Federacion imprimible queda separado de la trazabilidad tecnica de CharroPro. La hoja visible se construye exclusivamente desde `Official Format Snapshot` y conserva los datos de auditoria en `auditRows`, fuera del workbook oficial.

Cadena validada:

`Official Score -> Attempt V2 -> Official Format Snapshot -> XLSX -> PDF`

## Contrato visual

- Una hoja Carta vertical, ajustada a una sola pagina.
- Encabezado FMCH con evento, hora, equipo, fecha, capitan y lugar.
- Secciones oficiales de Cala, Piales, Coleadero, Toro, Terna, Yegua, Manganas a Pie, Manganas a Caballo y Paso.
- Coleadero conserva tres participantes por tres oportunidades; la cuarta fila es documental y permanece vacia.
- Totales, controles documentales, cuatro firmas manuales y pie institucional.
- Emblema FMCH y lockup CONADE embebidos desde el manifiesto certificado.
- Cero columnas tecnicas visibles.

## Invariantes

- No se modificaron valores deportivos.
- No se modifico `FMCH_2026_LIBRE 0.6.0`.
- No se modificaron Official Score, Attempt V2, CAS, idempotencia ni publicacion.
- El control lateral de Cala es exclusivamente documental.
- La trazabilidad tecnica no se elimina; queda desacoplada de la presentacion oficial.

## Fixture local

La demostracion usa una charreada sintetica, tres equipos y cero escrituras Firebase. Cada XLSX se convirtio a PDF en una pagina Carta vertical.

Totales finales:

| Equipo | Official Score | Malos individuales | Infraccion equipo | Puntuacion final |
| --- | ---: | ---: | ---: | ---: |
| Rancho Los Laureles | 324 | 28 | 3 | 321 |
| Hacienda San Miguel | 346 | 20 | 1 | 345 |
| Charros de Jalisco | 450 | 15 | 1 | 449 |

Firebase Production Writes: `0`.

## Estado Git

No se realizo commit, push ni deploy.
