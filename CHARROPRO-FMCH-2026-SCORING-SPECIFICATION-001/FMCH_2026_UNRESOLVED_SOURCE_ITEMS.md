# Elementos de fuente pendientes FMCH 2026

## 1. Regla de uso

Este documento contiene solo incertidumbres que no pueden resolverse sin una fuente, resolucion deportiva o artefacto historico adicional. No incluye trabajo de implementacion ya claro.

Estados:

- `SOURCE_CONFIRMATION_REQUIRED`: falta fuente oficial legible o resolucion competente.
- `SPORTS_DECISION_REQUIRED`: la fuente existe pero admite identidades operativas incompatibles.
- `HISTORICAL_ARTIFACT_REQUIRED`: se afirma una funcion historica sin artefacto recuperado.
- `DOCUMENT_COMPOSITION_REQUIRED`: falta definir composicion del documento, no deporte.

## 2. Bloqueos activos

### USI-001 - Equivalencias de Cala

- Estado: `SPORTS_DECISION_REQUIRED`.
- Hecho confirmado: el scorer usa grupos `ML` y `CR`; el formato auditado expone `MD`, `MI`, `PC` y controles laterales.
- Incertidumbre: equivalencia exacta de cada grupo/control con las celdas oficiales.
- Prohibido: inferir que `PC` significa cambio de rectangulo sin resolucion trazable.
- `BLOCKS_IMPLEMENTATION_OF: CHARROPRO-FMCH-2026-CALA-001` en su cierre de exportacion oficial.
- No bloquea: base 20, punta, lados, medios lados, cambio de rectangulo ni calculo deportivo.

### USI-002 - Cuarta fila de Coleadero

- Estado: `SOURCE_CONFIRMATION_REQUIRED`.
- Hecho confirmado: Reglamento art. 113 integra el equipo con tres coleadores; arts. 114-115 permiten suplente/otro integrante por fuerza mayor.
- Hecho del formato: existen `PARTICIPANT_04.NAME` y `BOTTOM_CONTROL_04`.
- Incertidumbre: si la cuarta fila representa suplente, reserva, resumen u otro uso documental.
- Prohibido: convertirla automaticamente en cuarto coleador activo.
- `BLOCKS_IMPLEMENTATION_OF: CHARROPRO-FMCH-2026-COLEADERO-001` para equivalencia completa del formato.
- No bloquea: matriz 3 x 3, orden, sustitucion reglada, caidas, distancia ni score.

### USI-003 - Doble `Contra mascara` en Manganas a Caballo

- Estado: `SOURCE_CONFIRMATION_REQUIRED`.
- Fuente: art. 217, pagina 89.
- Hecho: el renglon VI incluye `Rematada de espalda a la yegua, contra mascara o mascara con el caballo de ancas hacia la barda` por 14; el renglon VII vuelve a listar `Contra mascara` por 14.
- Incertidumbre: si el segundo renglon distingue una ejecucion no recuperada por el texto o es redundancia editorial.
- Regla segura: ambos valores impresos son 14; no asignar dos RuleID semanticas sin aclaracion.
- `BLOCKS_IMPLEMENTATION_OF: CHARROPRO-FMCH-2026-MANGANAS-CABALLO-001` para catalogo definitivo de identidades.
- No bloquea: puntaje 14, otras bases, Centenario, floreo, timer, tirones ni DQ.

### USI-004 - Controles sin etiqueta/formula del formato

- Estado: `SOURCE_CONFIRMATION_REQUIRED`.
- Alcance: 36 FieldID ambiguos de controles laterales, auxiliares, inferiores y posteriores a infracciones en Piales, Colas, Toro, Terna, Yegua, Manganas y Paso.
- Incertidumbre: etiqueta, formula y condicion de llenado.
- `BLOCKS_IMPLEMENTATION_OF: CHARROPRO-FMCH-OFFICIAL-EXPORT-CERTIFICATION-001`.
- No bloquea: scorer 2026 ni calculo oficial por intento.

### USI-005 - Firmas y validez documental

- Estado: `DOCUMENT_COMPOSITION_REQUIRED`.
- FieldID: `SIGNATURES.JUDGE_01..03` y `SIGNATURES.CAPTAIN`.
- Hecho: existen nombres/asignaciones; no existe contrato certificado de captura de firma, consentimiento, validez o cierre.
- `BLOCKS_IMPLEMENTATION_OF: CHARROPRO-FMCH-OFFICIAL-EXPORT-CERTIFICATION-001`.
- No bloquea: score, publicacion ni historial.

### USI-006 - Elementos institucionales

- Estado: `DOCUMENT_COMPOSITION_REQUIRED`.
- Faltantes: logo FMCH, logo/nombre CONADE, periodo de secretaria y cita institucional.
- `BLOCKS_IMPLEMENTATION_OF: CHARROPRO-FMCH-OFFICIAL-EXPORT-CERTIFICATION-001`.
- No bloquea: reglas deportivas.

### USI-007 - `Pendiente a revision`

- Estado: `HISTORICAL_ARTIFACT_REQUIRED`.
- Hecho: no aparece en HEAD, commits, ramas, etiquetas, reflog ni documentos disponibles.
- No se conocen estado, permisos, persistencia, efecto oficial ni boton.
- `BLOCKS_IMPLEMENTATION_OF:` cualquier ticket que pretenda recuperar ese flujo historico.
- No bloquea: scorer FMCH 2026 ni publicacion actual `Guardar y siguiente`.

## 3. Elementos ya resueltos por fuente primaria

Los siguientes no deben seguir marcados como ambiguos:

| Elemento | Resolucion | Fuente |
| --- | --- | --- |
| Yegua - Jugar piernas | `3/2/1/0/0` | Tabla pagina 78 |
| Yegua - Oreja/cruzar pierna | `1/1/1/0/0` | Tabla pagina 78 |
| Paso - no soltarse dentro de dos trancos | `-4` | Infraccion XVI, pagina 97 |
| Paso - no intentar faena | `-10` | Infraccion XVII, pagina 97 |
| Manganas - tercer tiron | Incremento `-2`, total acumulado `-4` | Art. 208 y listas de infracciones |
| Terna - tiempo | `+2` por minuto, uno a cabeza y uno a pial, ambos de cuenta | Arts. 155 y tabla pagina 72 |
| Yegua - no repara | Minima 6 sin adicionales, no DQ | Arts. 173 y 178 |

## 4. Brechas que no requieren nueva fuente deportiva

Estas son implementaciones o defectos conocidos, no incertidumbres reglamentarias:

- `ttm` duplicado entre Tentemozo y Tiempo excedido: requiere IDs separados y migracion segura.
- Toro/Yegua/Paso dinamicos: las matrices ya estan confirmadas.
- Terna actual con intentos independientes: debe migrar a cinco compartidas.
- Catalogos legacy incompletos: deben sustituirse de forma controlada por las tablas confirmadas.
- Semantica de `Deshacer`: hoy es navegacion; un undo deportivo seria un ticket nuevo.
- Resolucion de charreada activa del formato, multi-juez y encabezados: son integracion/operacion.

## 5. Regla de cierre por ticket

Un ticket por suerte puede iniciar si todas sus reglas deportivas son `COMPLETE`. Si contiene un item `COMPLETE_WITH_BLOCKED_FIELDS`, puede implementar solo lo no bloqueado y no certificar exportacion/identidad afectada hasta resolver el item. Nunca se elige un valor provisional para conseguir estado `COMPLETE`.
