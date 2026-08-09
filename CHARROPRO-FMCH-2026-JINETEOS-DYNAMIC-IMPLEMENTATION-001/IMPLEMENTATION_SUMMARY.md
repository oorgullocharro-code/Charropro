# Implementación FMCH 2026 de Jineteos Dinámicos

## Alcance

Se implementaron conjuntamente Jineteo de Toro y Jineteo de Yegua sobre una sola mecánica reutilizable. No se creó un scorer paralelo ni motores separados por suerte.

El perfil `FMCH_2026_LIBRE` avanza de `0.3.0` a `0.4.0`, conserva estado `draft`, `activationReady: false` y no se activa en Producción.

## Mecánica compartida

El módulo `js/data/fmch2026JineteosRules.js` concentra:

- clasificaciones `Excelente`, `Buena`, `Regular`, `Media Regular` y `Mínima`;
- base `20/16/12/8/6`;
- resolución `classificationId + selectedRuleId -> resolvedValue`;
- reconciliación de selecciones al cambiar clasificación;
- temporización y ajustes reglamentarios;
- regla `No repara` exclusiva de Yegua;
- catálogos de adicionales, infracciones, infracciones al equipo y DQ.

La UI consume el Rule Profile. Los puntos no están codificados como fuente de verdad en el HTML.

## Contratos preservados

- Attempt V2 conserva `selectedRuleId` y congela `resolvedValue` por separado.
- Cambiar clasificación conserva selecciones compatibles, nota y evidencia.
- Un `resolvedValue` de cero sigue siendo una selección válida y no equivale a `Marcar 0` ni a DQ.
- DQ conserva infracciones, infracciones al equipo, selecciones, evidencia y nota.
- Los históricos siguen usando el adaptador legacy y no se recalculan.
- `Guardar y siguiente`, publicación oficial, audit y score protection conservan sus contratos existentes.
- Cala, Piales y Coleadero no recibieron cambios deportivos.

## Toro

Toro incluye las cinco clasificaciones, matriz dinámica, infracciones, infracciones al equipo, DQ, manuales y temporización declarativa. Las identidades legacy duplicadas `ttm` se separan en RuleID nuevos para Tentemozo y tiempo, sin migrar ni reinterpretar históricos.

## Yegua

Yegua incluye la matriz dinámica confirmada por el ticket, infracción dinámica `Descomponerse`, infracciones al equipo, DQ, manuales y temporización de cinco minutos.

`No repara` se resuelve como `Mínima = 6`, elimina adicionales y no produce DQ. El tiempo aplica `+1` por minuto completo ahorrado dentro de los primeros tres cuando corresponde; después de tres y cuatro minutos aplica una infracción por umbral y después de cinco minutos aplica la consecuencia DQ configurada.

## Defecto común corregido

El perfil completo superó el límite interno de 300 elementos del sanitizador declarativo. El límite se amplió a 500 para alojar el perfil válido de 357 reglas sin truncarlo. La regresión verifica que un torneo completo puede resolver sus diez suertes con el perfil local activo, sin activar Producción.

## Resultado

La implementación técnica y deportiva del alcance confirmado queda aprobada. La activación productiva del perfil permanece fuera de este ticket.
