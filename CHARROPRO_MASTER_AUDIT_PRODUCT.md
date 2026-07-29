# CharroPro Master Audit - Producto y operación

## Estado del producto

CharroPro cubre el flujo esencial de un evento de charrería con profundidad de dominio. La debilidad no es la ausencia de pantallas, sino el cierre incompleto de lifecycle, recuperación, administración maestra y operación comercial.

## Funciones completas o funcionales

- Crear y editar torneos.
- Crear programa/charreadas con fase, categoría y competencia.
- Registrar equipos y participantes individuales embebidos.
- Calificar suertes con reglas existentes.
- Capturar evidencia manual de tiempo.
- Publicar score oficial a rutas privadas/live/audit en multipath.
- Mostrar resultados internos, ranking y sábana por competencia.
- Exportar CSV/XLSX/JSON.
- Generar snapshot público V2.
- Mostrar portal público por competencia.
- Live Feed/minuto a minuto basado en proyección pública.
- Gestionar usuarios con roles básicos.
- Operar Preview/Program/Program Main/Announcer en Broadcast V2.
- Descargar backup JSON y crear backup remoto previo a borrado.

Estas funciones no implican que el producto completo esté validado.

## Funciones parciales

| Función | Estado real |
| --- | --- |
| Participantes/caballos | Campos por jornada/equipo, sin Master Data, consentimiento o deduplicación |
| Estadísticas | Cálculo y snapshots, sin gobierno histórico completo |
| Corrección oficial | Revisión local, sin ledger remoto transaccional |
| Publicación pública | V2 sólida, sin reparación durable |
| Recovery | Backup/descarga, sin restore |
| Auditoría | Registro, pero mutable por reglas |
| Archivo/cierre | Estados básicos, sin lifecycle archivado/tombstone |
| Usuarios | Alta/edición/desactivación, sin invitación/reset/session control |
| Broadcast | Motor y salidas, sin editor profesional/multi-tenant real |
| Minuto a minuto | Vista/proyección, no event log durable |
| Offline | Cache/draft local, no operación offline |

## Funciones no implementadas

- Restauración completa o parcial.
- Papelera y recuperación de torneo eliminado.
- Master Data de charros, caballos, asociaciones y propietarios.
- Organizaciones/tenants del core.
- Suscripciones, planes, facturación y entitlement.
- Importación gobernada.
- Notificaciones y soporte.
- Auditoría comercial y métricas por cliente.
- Editor visual Broadcast de capas/layout.
- NDI/video/audio profesional.
- Modo Arena offline con servidor local/event log.
- SLO, alertas y observabilidad central.

## Ciclo de vida auditado

| # | Fase | Responsable/fuente/escritura | Estado/falla/recuperación |
| ---: | --- | --- | --- |
| 1 | Crear torneo | `app.js` -> `tournaments`, `tournamentIndex` | Funcional; sin organizationId |
| 2 | Configurar torneo | app/settings/rules overrides | Funcional; permisos amplios |
| 3 | Crear charreadas | programa -> `charreadas` | Funcional |
| 4 | Registrar equipos | app -> teams | Funcional, identidad local al torneo |
| 5 | Registrar participantes | individualParticipants/roster | Parcial, sin IDs maestros |
| 6 | Registrar caballos | `horseName` embebido | Parcial, sin entidad |
| 7 | Asignar jueces | users/judges assignments | Existe, no E2E con reglas |
| 8 | Crear programa | charreadas + competition metadata | Funcional |
| 9 | Seleccionar charreada activa | meta/live context | Guard remoto previo a score |
| 10 | Seleccionar turno | live turn | Funcional, sin autoridad transaccional |
| 11 | Capturar calificación | state/scoring | Funcional |
| 12 | Guardar borrador | localStorage | Solo navegador; error storage no contenido |
| 13 | Publicar calificación | multipath privado | Atómico en privado, no en portal |
| 14 | Actualizar auditoría | mismo multipath | Existe, pero mutable |
| 15 | Actualizar standings | derivados/live/public | Puede quedar pendiente con proyección |
| 16 | Actualizar sábana | resultados internos/public snapshot | Interna disponible; pública depende de snapshot |
| 17 | Actualizar rankings | internos derivados; público `unavailable`/derivado | Parcial |
| 18 | Actualizar Live Feed | public projection | Sin outbox |
| 19 | Actualizar minuto a minuto | feed/templates | Sin event log independiente |
| 20 | Actualizar portal | `publicTournaments` | Puede quedar stale |
| 21 | Actualizar Broadcast | contract/live bindings/realtime | Funcional cuando el contexto se publica |
| 22 | Finalizar suerte | flujo de calificador | Funcional, eventos no durables |
| 23 | Finalizar equipo | flujo local/estado | Funcional parcial |
| 24 | Finalizar charreada | estados de programa | Funcional, sin lifecycle auditado end-to-end |
| 25 | Finalizar torneo | estado/congelación | Existe; no archivo formal |
| 26 | Publicar finales | proyección/estadísticas | Parcial y dependiente de snapshot |
| 27 | Exportar | exporters/xlsx | Funcional, sin roundtrip |
| 28 | Respaldar | JSON/Firebase backup | Exporta; no prueba restaurabilidad |
| 29 | Archivar | No hay archivo completo | No implementado |
| 30 | Restaurar | Placeholder “Próximamente” | No implementado |

## Qué ocurre en escenarios críticos

### Cierre del navegador durante captura

- El draft vive en estado/localStorage del navegador.
- Si el último `saveState` ocurrió y storage está disponible, se recupera en ese mismo perfil.
- No existe draft remoto ni outbox.
- Otro dispositivo no puede recuperar el trabajo.
- Si `localStorage.setItem` falla, no hay manejo en `saveState`.

### Dos usuarios publican simultáneamente

- Ambos pueden calcular la misma revisión local.
- Ambos crean IDs distintos.
- Firebase acepta ambos porque no existe transaction/expected revision por intento.
- Ninguno necesariamente supersede al otro remotamente.

### Corrección

- En un cliente consistente se crea una nueva publicación y se marca anterior como superseded localmente.
- Bajo concurrencia, la cabeza canónica es ambigua.
- Audit conserva registros, pero permite sobrescribir uno existente.

### Sin `publicTournaments`

- El portal no usa fallback privado.
- Muestra no encontrado/no disponible según el estado.
- Es correcto desde seguridad, pero requiere que publicación/reparación pública sea confiable.

### “Sin registrar”

- Se muestra fallback y el score puede seguir.
- Se pierde identidad para historial, estadísticas, merge y Master Data.

### Valor cero

- Cero real funciona.
- Ausencia/null/vacío puede normalizarse como cero en published score.

## Auditoría administrativa

| Módulo | Existe | Conectado | Listo para usuario final |
| --- | --- | --- | --- |
| Dashboard | Sí | Sí | Parcialmente |
| Torneos | Sí | Sí | Con riesgos de delete |
| Charreadas/programa | Sí | Sí | Sí, con pruebas reales pendientes |
| Equipos | Sí | Sí | Sí para modelo actual |
| Participantes | Parcial | Sí por jornada | No como Master Data |
| Caballos | Parcial | Campo libre | No |
| Jueces | Sí | Sí | Parcial |
| Usuarios/roles | Sí | Sí | Parcial |
| Configuración | Sí | Sí | Parcial |
| Patrocinadores | Metadata Broadcast | Parcial | No como módulo admin |
| Resultados | Sí | Sí | Sí, condicionado por datos |
| Estadísticas | Sí | Parcial | Parcial |
| Exportaciones | Sí | Sí | Parcialmente |
| Importaciones | No | No | No |
| Respaldos | Sí | Sí | No como Recovery |
| Restauración | Placeholder | No | No |
| Papelera | No | No | No |
| Archivo | No | No | No |
| Logs/auditoría | Parcial | Sí | No como herramienta completa |
| Suscripciones | No | No | No |
| Organizaciones | No | No | No |
| Preferencias/notificaciones/soporte | Parcial/no | No | No |

## Experiencia de usuario

### Fortalezas

- Navegación por rol.
- Portal público responsive y orientado a lectura.
- Estados de conexión/stale en portal/Broadcast.
- Guard de preparación y charreada activa.
- Recovery visible con conteos.
- Accesos públicos/copiar URL.
- Separación por competencia en Programa/Resultados/Portal.

### Riesgos operativos

- El guard de “preparar/sincronizar” requiere conocimiento técnico.
- La aplicación central tiene muchas acciones y contextos en una sola superficie.
- “Guardado; portal pendiente” informa, pero no ofrece reparar/reintentar.
- “Protegido” en Recovery depende de historial local, no de integridad/restauración.
- El usuario puede avanzar después de una publicación pública parcial.
- Roles de lectura pueden disparar exportación de backup por cómo se evalúa `READ_ACTIONS`.
- Turno, charreada activa, torneo y sincronización están presentes, pero el error de autoridad concurrente no es visible.
- No hay guía operativa in-app ni runbook confiable para incidente.

### Accesibilidad y responsive

- El portal tiene CSS y pruebas estáticas de responsive.
- No existe suite de navegador real ni auditoría automatizada WCAG.
- No se verificaron en hardware real tableta/teléfono/luz exterior durante esta auditoría.
- La UI interna usa HTML generado y controles densos; requiere prueba con usuarios bajo presión.

## Preparación SaaS

Bloqueos:

- sin organization/tenant en entidades y reglas;
- sin billing/subscription/entitlement;
- sin límites por plan/dispositivo/evento;
- sin medición de uso/costo;
- sin suspensión/grace period;
- sin aislamiento de configuración/estadísticas;
- sin backups/restore por cliente;
- sin DPA/consentimiento operacional implementado;
- sin soporte/incident lifecycle.

## Preparación offline

Viable a largo plazo si se conserva el dominio y se introduce:

1. IDs globales/offline.
2. Event log append-only.
3. Outbox local durable.
4. Autoridad LAN para score/turn/timer.
5. Reconciliación determinista al cloud.
6. Paquetes firmados de torneo/licencia.
7. Conflictos explícitos y operación de merge.
8. Portal/Broadcast locales.

La caché actual no debe presentarse como modo offline.

## Conocimiento manual

Dependen especialmente de personal técnico:

- preparación/sincronización previa;
- reparación de portal pendiente;
- diagnóstico Firebase;
- elección de páginas V1/V2;
- configuración Broadcast/session URLs;
- reglas/deploy;
- backup sin restore;
- interpretación de logs;
- limpieza de cache/cache-busters.

## Preparación comercial

CharroPro puede demostrarse y operarse en eventos controlados. No debe venderse todavía como plataforma autoservicio con garantías de disponibilidad, recuperación y aislamiento. El cierre comercial requiere primero Fases 0-2 del roadmap maestro.
