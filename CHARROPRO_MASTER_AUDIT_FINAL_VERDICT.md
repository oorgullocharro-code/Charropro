# CharroPro Master Audit - Dictamen final

## Resultado

# NO APROBADO

Existen riesgos críticos que impiden continuar con nuevos desarrollos mayores o comercializar el producto.

## Justificación

CharroPro tiene suficiente funcionalidad para operar eventos controlados y demuestra una arquitectura Broadcast/Public V2 valiosa. El bloqueo no es cosmético: el sistema puede aceptar un score privado y dejar el portal pendiente sin recuperación durable; dos clientes pueden publicar el mismo intento sin cabeza transaccional; la auditoría se puede sobrescribir; el borrado puede dejar datos públicos; y no existe restauración verificable.

Estas condiciones impiden prometer integridad, recuperación, aislamiento y continuidad como producto comercial.

## Bloqueos

1. Proyección pública/Live Feed sin outbox ni reparación durable.
2. Publicación concurrente del mismo intento.
3. Auditoría mutable.
4. Instancias duplicadas de módulos por cache-busters.
5. Borrado/tombstone incompleto.
6. Cronómetro sin autoridad transaccional.
7. Recovery sin restore.
8. Reglas privadas y acceso por torneo demasiado amplios.
9. Ausencia de pruebas Emulator/E2E para los flujos anteriores.
10. Ausencia de tenant/organization para SaaS.

## Acciones inmediatas

1. Ejecutar `CHARROPRO-PUBLIC-PROJECTION-LIVE-FEED-SCORE-PUBLISH-RECOVERY-001`.
2. Ejecutar `OFFICIAL-SCORE-CONCURRENCY-001`.
3. Ejecutar `AUDIT-IMMUTABILITY-001`.
4. Ejecutar `CORE-RUNTIME-MODULE-IDENTITY-001`.
5. Ejecutar `TOURNAMENT-DELETION-CONSISTENCY-001`.
6. Ejecutar `TIMER-AUTHORITY-CONCURRENCY-001`.
7. Crear gates Emulator/E2E.
8. Implementar y probar restore antes de comercializar.

## Qué no debe hacerse todavía

- Nuevos desarrollos mayores.
- Editor Broadcast profesional.
- NDI/video/audio.
- Expansión SaaS/billing.
- Multi-organización productiva.
- Modo Arena/offline.
- IA/analytics nuevos.
- Refactor general sin tests.
- Eliminación de legacy sin telemetría.

## Próximo ticket

**`CHARROPRO-PUBLIC-PROJECTION-LIVE-FEED-SCORE-PUBLISH-RECOVERY-001`**

Debe incluir outbox durable, idempotencia, retry, reconciliación, dead-letter, repair manual y observabilidad. Inmediatamente después debe ejecutarse el ledger transaccional de score; no debe mezclarse ambos riesgos en un único cambio inmanejable.

## Respuestas obligatorias

### 1. ¿Cuál es el porcentaje real de avance?

53% de preparación integral de producto. No es porcentaje de líneas implementadas.

### 2. ¿Qué módulos están realmente terminados?

Contratos focales como reglas de cala y catálogo de competencias. Varios motores Broadcast están funcionales con deuda, no clasificados A por falta de validación real.

### 3. ¿Qué parece terminado pero no lo está?

Recovery, auditoría, Timer Display V2, editor Broadcast, participantes/caballos maestros, Live Feed durable y lifecycle de torneo.

### 4. ¿Qué presenta riesgo de pérdida/integridad?

Publicación oficial concurrente, proyección pública parcial, timer, delete, drafts solo locales y ausencia de restore.

### 5. ¿Qué presenta riesgo de seguridad?

Audit mutable, `live` público, reglas privadas laxas, acceso default `all`, juez con escrituras amplias, backups exportables y falta de tenant.

### 6. ¿Qué flujos fallan parcialmente?

Score/turn/timer -> portal; delete -> cleanup; backup -> recuperación; publicación privada -> Broadcast/public consumers.

### 7. ¿Qué legacy sigue activo?

Gráficos/OBS/locutor/timer V1, vista pública legacy, adapter público legacy y Access Hub probado aunque reemplazado en el entrypoint principal.

### 8. ¿Qué rutas son fuente de verdad?

`tournaments/{id}` para torneo/scores/publicados; `live/{id}` para contexto operativo; `publicTournaments/{id}` es proyección pública; `audit/publishedScores` debería ser ledger; Broadcast sessions son proyecciones de salida.

### 9. ¿Qué proyecciones pueden desincronizarse?

`publicTournaments`, Live Feed/minuto a minuto, standings públicos y outputs Broadcast si falla la etapa posterior.

### 10. ¿Qué sucede si Firebase falla durante publicación?

Si falla el multipath privado, no avanza. Si falla después, el score queda oficial pero el portal puede quedar stale y el flujo avanza.

### 11. ¿Qué sucede si el navegador cierra durante captura?

Solo se recupera el draft del mismo navegador si `localStorage` se escribió; no existe draft remoto/outbox.

### 12. ¿Qué sucede si dos usuarios publican?

Pueden crear dos registros activos del mismo intento con revisión local equivalente.

### 13. ¿Qué sucede al corregir?

Un cliente crea nueva versión y supersede localmente la anterior; bajo concurrencia no existe cabeza remota única.

### 14. ¿Qué sucede con “Sin registrar”?

El flujo continúa con fallback, pero no hay identidad histórica confiable.

### 15. ¿Qué sucede con 0?

El cero real se conserva, pero ausencia/null/vacío también puede convertirse en cero.

### 16. ¿Qué sucede si no existe `publicTournaments`?

El portal no lee privado; muestra no disponible/no encontrado. La seguridad es correcta, la disponibilidad depende del publicador.

### 17. ¿Qué sucede si cambia la charreada activa?

El guard remoto bloquea la publicación si ya no coincide.

### 18. ¿Qué sucede si el turno queda atrasado?

Portal/Broadcast reproducen el turno stale; correctamente no deben inferirlo del último score.

### 19. ¿Qué consume Broadcast?

Broadcast Data Contract construido desde contexto privado/live, luego variables/bindings, Preview, Program y outputs.

### 20. ¿Qué consume el portal?

Únicamente `publicTournaments/{tournamentId}` en V2.

### 21. ¿Qué consume el minuto a minuto?

La sección Live Feed de la proyección pública, combinando eventos explícitos y derivados de scores.

### 22. ¿Qué depende de conocimiento manual?

Preparación/sync, reparación pública, reglas/deploy, elección V1/V2, Broadcast URLs, backup sin restore y diagnóstico por consola.

### 23. ¿Qué no tiene recuperación?

Proyección pública pendiente, publicación concurrente, timer conflict, delete público/Broadcast, restore de backup y draft entre dispositivos.

### 24. ¿Qué no tiene pruebas suficientes?

Firebase Rules reales, Auth/callable, score concurrency, restore, browser E2E, visual/accessibility, performance, core offline y timer authority.

### 25. ¿Qué impide comercializar hoy?

Integridad no transaccional, recuperación inexistente, seguridad/tenant, testing real, observabilidad, lifecycle comercial y soporte.

### 26. ¿Qué impide operar sin Internet?

Firebase/Auth como autoridad, ausencia de event log/outbox local, conflictos/reconciliación y servidor LAN.

### 27. ¿Qué impide múltiples organizaciones?

Sin tenant/org en core, reglas globales, usuarios con acceso `all` y Broadcast tenant fijo.

### 28. ¿Qué debe corregirse inmediatamente?

Los seis P0 listados: public outbox, score ledger, audit, module identity, delete y timer.

### 29. ¿Qué desarrollo debe detenerse?

Toda expansión mayor no relacionada con estabilización, pruebas, recuperación u observabilidad.

### 30. ¿Cuál es el siguiente ticket?

`CHARROPRO-PUBLIC-PROJECTION-LIVE-FEED-SCORE-PUBLISH-RECOVERY-001`.

## Condiciones para una nueva evaluación

CharroPro puede volver a dictamen después de demostrar:

- cero publicaciones pendientes sin estado reparable;
- una sola versión activa por intento bajo concurrencia;
- audit append-only;
- delete/restore probado;
- module identity única;
- timer authority;
- rules Emulator y E2E juez -> portal -> Broadcast;
- runbook de incidentes;
- árbol y release reproducibles.

## Decisión ejecutiva

- Operación controlada actual: posible con personal experto y plan de contingencia.
- Nuevos desarrollos mayores: detener.
- Comercialización SaaS: detener.
- Roadmap de estabilización: iniciar de inmediato.
