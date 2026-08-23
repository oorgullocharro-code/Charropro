# FMCH Official Format Certification State Reconciliation

## Dictamen

`APROBADO` como reconciliacion documental.

La certificacion deportiva posterior de `FMCH_2026_LIBRE 0.6.0` prevalece
sobre las matrices historicas que conservaron estados `PENDING_VALIDATION`,
`BLOCKED` o `PARTIAL`. El perfil tiene certificacion `PASS`, P0 `0`, elegibilidad
de activacion y fingerprint `rptp_0f90f7a3944a82d7`. Su estado productivo
`ACTIVE` pertenece a Lifecycle Authority; el `draft` que aparece en el registro
historico describe el momento de certificacion, no el estado productivo actual.

## Resultado medido

- FieldID inventariados: `239/239`.
- Bloqueos deportivos realmente abiertos: `0`.
- Bloqueos documentales para equivalencia exacta: `0`.
- Bloqueos institucionales sin fuente/asset: `0`.
- Bloqueos de arquitectura del exportador: `3`.
- Estados bloqueantes historicos retirados: `199` FieldID (`190` con
  compatibilidad deportiva pendiente y `9` relaciones de la cuarta fila que
  ahora son administrativas).
- P0 deportivos historicos reconciliados: `5/5`.

## Clasificacion reconciliada

| Clasificacion | Campos | Significado |
| --- | ---: | --- |
| `SPORTING_CANONICAL` | 88 | Dato deportivo cubierto por el perfil certificado. |
| `DOCUMENT_ALIAS` | 3 | Alias impreso que apunta a una regla existente. |
| `DOCUMENT_CONTROL` | 38 | Control de hoja sin autoridad deportiva independiente. |
| `ADMINISTRATIVE` | 39 | Identidad, roster o espacio administrativo. |
| `MANUAL` | 4 | Firma manual; no es actor de auditoria. |
| `DERIVED` | 62 | Resultado derivable de la verdad oficial, sin regla nueva. |
| `INSTITUTIONAL_RESOLVED` | 5 | Elemento institucional resuelto solo para el documento 2024-2028. |
| `UNSUPPORTED_REAL_BLOCKER` | 0 | No quedan elementos institucionales sin fuente. |

La clasificacion semantica no declara listo al exportador. Todos los campos que
dependen de resultado deportivo deben obtenerse de Official Score / Attempt V2
congelado; la implementacion actual todavia no cumple esa frontera.

## Resoluciones vigentes

- Cala `ML/MD/MI`: `MD` y `MI` son miembros del grupo documental `ML` y usan
  `cala_medio_derecho` y `cala_medio_izquierdo`.
- Cala `CR/PC`: `PC` es alias impreso de la regla existente
  `cala_cambio_rectangulo_costado`, agrupada como `CR`.
- Suma Puntos Malos / Suma Control: control documental de subtotal o
  verificacion, con efecto deportivo `NONE`.
- Coleadero: tres participantes por tres oportunidades. La cuarta fila impresa
  y su control inferior son administrativos y nunca crean un cuarto competidor.
- Contra mascara: una sola identidad canónica,
  `manganas_caballo_base_contra_mascara`, valor `14`, sin doble cobro.
- Cala: el subtotal lateral usa exclusivamente
  `SIDE_BAD_POINTS_SUM_CONTROL`, derivado del Attempt V2 congelado y sin efecto
  sobre el score.
- Coleadero: la cuarta fila y el cuarto control inferior son documentales; no
  crean competidor, Attempt ni puntuacion, y el control permanece vacio sin
  fuente canonica.
- Cierre: cuatro espacios manuales, en orden `JUEZ / JUEZ / JUEZ / CAPITÁN`,
  sin sello, folio ni autorizacion inferidos.

## Estado del Formato Federacion

La semantica deportiva y la fuente institucional 2024-2028 estan resueltas.
El Formato Federacion queda `READY`: las cuatro revisiones documentales estan
cerradas, el XLSX embebe los dos PNG versionados y el golden determinista se
renderizo en una pagina carta vertical para comparacion visual con el PDF. El
snapshot consume Official Score / Attempt V2 congelado y no recalcula deporte.

No se modificaron scorer, reglas, Rule Profile, Firebase ni valores deportivos.
