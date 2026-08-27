# Root Cause Matrix

| Sintoma | Causa | Correctivo |
|---|---|---|
| Timer anterior retenido | Seleccion local privilegiaba un `RUNNING` historico | La definicion del contexto deportivo vigente gana siempre |
| Refresh necesario | Telefono conservaba `selectedTimerId` en session storage | `currentTimerContext` llega por live/current y se reconcilia en vivo |
| Coleadero heredaba tiempo | Identidad de oportunidad no gobernaba la seleccion | Cada coleador/oportunidad tiene `timerId` propio y nace `READY` |
| Piales bloqueado | Faltaba resultado de la oportunidad anterior del mismo equipo | Resolucion desde Attempt/score canonico por equipo y oportunidad |
| Scorer congelado | El ticker podia quedar fuera de la superficie visible | Ticker compartido actualiza nodos DOM puntuales, sin render completo |
| Toro no aplicaba tiempo | Capability faltante caia en permiso `manage` | `apply-jineteo-timing` usa capability `score` |
| Historicos competian en telefono | Lista secundaria era seleccionable | Historial colapsado, de solo evidencia |
| Retry aparentaba nueva aceptacion | Retry idempotente podia reproyectar | Retorna `skipped:true`; no reescribe live ni `acceptedAt` |
| Subfase FINISHED no avanzaba | Contexto proyectado fijaba la primera definicion | FINISHED avanza a la siguiente definicion pendiente |
