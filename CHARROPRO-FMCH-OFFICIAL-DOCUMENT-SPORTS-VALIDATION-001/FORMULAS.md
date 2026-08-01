# Fórmulas y dependencias

Una fórmula documentada no equivale a una fórmula autorizada para producción. Los estados SPORTS_INFERENCE y PENDING_VALIDATION bloquean implementación.

## FORM-CALA-PUNTA — Adicionales de punta de cala

- Estado: OFFICIAL_REGULATION
- Expresión: puntos por tiempos + metros válidos por encima de seis, sujeto a requisitos reglamentarios.
- Referencia: Reglamento 2026, art. 94 y Calificaciones de Cala, p. 38
- Implementación: REQUIRES_FULL_CONDITION_CATALOG

## FORM-CALA-BAD-POINTS — Suma puntos malos de Cala

- Estado: PENDING_VALIDATION
- Expresión: SUM(casillas de malos aplicables).
- Referencia: Formato oficial: ocho casillas y TOTAL MALOS, sin catálogo por casilla.
- Implementación: BLOCKED

## FORM-CALA-PARTIAL — Puntos parciales de Cala

- Estado: SPORTS_INFERENCE
- Expresión: Subtotal de componentes de Cala antes del cierre de sección.
- Referencia: Formato oficial y Reglamento 2026, pp. 38-43.
- Implementación: BLOCKED_PENDING_JUDGE_CONFIRMATION

## FORM-CALA-SECTION — Total de Cala

- Estado: SPORTS_INFERENCE
- Expresión: base + adicionales validados - infracciones validadas - infracción de equipo aplicable.
- Referencia: Reglamento 2026, p. 38; formato oficial.
- Implementación: BLOCKED_PENDING_ABBREVIATION_MAPPING

## FORM-OPPORTUNITY-NET — Total neto de oportunidad o pasada

- Estado: SPORTS_INFERENCE
- Expresión: BUENO - MALOS de la misma oportunidad o pasada.
- Referencia: Formato oficial: BUENO, MALOS y TOTAL; capítulo de la suerte.
- Implementación: BLOCKED_PENDING_FORMULA_CERTIFICATION

## FORM-PIALES-SECTION — Total de Piales

- Estado: SPORTS_INFERENCE
- Expresión: SUM(tres oportunidades) más componentes certificables de tiempo e infracción.
- Referencia: Reglamento 2026, arts. 95-110, pp. 45-49.
- Implementación: BLOCKED_PENDING_T_COLUMN_CONFIRMATION

## FORM-COLEADERO-SECTION — Total de Coleadero

- Estado: PENDING_VALIDATION
- Expresión: Agregación de pasadas y participantes según topología oficial.
- Referencia: Reglamento 2026, arts. 111-133; formato oficial.
- Implementación: BLOCKED

## FORM-JINETEO-PARTIAL — Subtotal de Jineteo

- Estado: OFFICIAL_REGULATION
- Expresión: base de clasificación + adicionales de tabla aplicable.
- Referencia: Toro p. 59; Yegua p. 77 del Reglamento 2026.
- Implementación: REQUIRES_TABLE_ENCODING

## FORM-JINETEO-FINAL — Total final de Jineteo

- Estado: SPORTS_INFERENCE
- Expresión: subtotal - malos + T o tiempo cuando su vínculo sea confirmado.
- Referencia: Reglamento 2026, pp. 59 y 77; formato oficial.
- Implementación: BLOCKED_PENDING_T_COLUMN_CONFIRMATION

## FORM-TERNA-ROW — Total de fila de Terna

- Estado: PENDING_VALIDATION
- Expresión: base/adicionales + remate - malos + T, con asignación pendiente por participante.
- Referencia: Reglamento 2026, arts. 149-170; formato oficial.
- Implementación: BLOCKED

## FORM-MANGANAS-SECTION — Total de Manganas

- Estado: SPORTS_INFERENCE
- Expresión: SUM(tres oportunidades) + T o tiempo si se certifica - infracciones.
- Referencia: Reglamento 2026, arts. 186-217, pp. 81-92.
- Implementación: BLOCKED_PENDING_T_COLUMN_CONFIRMATION

## FORM-PASO-SECTION — Total de Paso

- Estado: SPORTS_INFERENCE
- Expresión: base de vuelta + adicionales aplicables - malos - infracciones.
- Referencia: Reglamento 2026, arts. 218-239, pp. 93-100.
- Implementación: BLOCKED_PENDING_COLUMN_MAPPING

## FORM-CLOSING-BAD-POINTS — TOTAL, PUNTOS MALOS

- Estado: PENDING_VALIDATION
- Expresión: Agregación de puntos malos por reglas aprobadas.
- Referencia: Formato oficial, celda de cierre sin operador.
- Implementación: BLOCKED

## FORM-CLOSING-FINAL — PUNTUACIÓN FINAL

- Estado: PENDING_VALIDATION
- Expresión: Total oficial de hoja después de todas las reglas autorizadas.
- Referencia: Formato oficial y Reglamento 2026, sin fórmula de cierre vinculada.
- Implementación: BLOCKED

Las fórmulas de TOTAL, PUNTOS MALOS y PUNTUACIÓN FINAL no se sustituyen con cálculos internos.
