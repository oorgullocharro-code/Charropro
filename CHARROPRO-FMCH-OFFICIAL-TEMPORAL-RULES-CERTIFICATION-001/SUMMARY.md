# Summary

## Dictamen tecnico

La autoridad reglamentaria temporal de `FMCH_2026_LIBRE@0.6.0` fue auditada contra el PDF oficial certificado y modelada dentro de la autoridad existente `js/core/timerRules.js`.

- Fuente primaria: Reglamento Oficial General para Competencias de Charros 2024-2028, revision VF2-2026.
- SHA-256 verificado: `1343e2205c7b6599a2ab7e93a809a5a45bd5ab1aadaba2f5a25bf43db8b4af2b`.
- Suertes auditadas: 10/10.
- `CERTIFIED`: 10.
- `CERTIFIED_NO_TIMER_REQUIRED`: 0.
- `UNRESOLVED_REQUIRES_SPORTING_AUTHORITY`: 0.
- Politica temporal: `FMCH_2026_LIBRE_OFFICIAL_TEMPORAL_RULES@1.0.0`.
- Fingerprint temporal: `fmchtp_7d1e001181026f6d`.

## Frontera de activacion

La politica esta `CERTIFIED_NOT_ACTIVATED`. El resolver exige de forma explicita `FMCH_2026_LIBRE@0.6.0`, rechaza `PRODUCT_BASE`, no se conecta aun a los consumidores productivos y no cambia el comportamiento operativo vigente.

El perfil deportivo activo `FMCH_2026_LIBRE@0.6.0` conserva su fingerprint `rptp_0f90f7a3944a82d7`. No se modificaron reglas, valores, formulas, Attempt V2, Official Score ni historicos.

## Hallazgos principales

- Cala tiene dos fases: revision de freno/montar y salida del partidero.
- Piales usa un plazo condicional de 2 o 3 minutos por oportunidad; resolverlo exige el resultado canonico de la oportunidad anterior.
- Coleadero usa 20 segundos, no los 15 segundos del helper legacy.
- Toro y Yegua tienen una ventana total de apretalamiento de 5 minutos, con umbrales reglamentarios a los 3 y 4 minutos.
- Terna comparte una sola ventana de 7 minutos entre Cabecero y Pial.
- Yegua y Paso incluyen una fase separada de un minuto para desmontarse.
- Manganas a Caballo incluye una transicion de 2 minutos despues de Manganas a Pie.

## Produccion

- Firebase Production Writes: 0.
- RTDB Rules: sin cambios.
- Functions: sin cambios.
- Deploy: no corresponde hasta autorizar la integracion/activacion de esta politica.
- Live interpolation: fuera de alcance y sin cambios.
