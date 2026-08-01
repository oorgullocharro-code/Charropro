# Riesgos residuales

## Reglas no desplegadas

`firebase-rules-auditoria.json` contiene el permiso y schema del outbox, pero no
se hizo deploy. El codigo no debe publicarse a produccion antes de desplegar y
validar esas reglas de forma controlada.

## Sin Firebase Emulator

Las reglas tienen validacion estatica y espejo ejecutable, no una prueba RTDB
Emulator. El espejo cubre los casos negativos requeridos, pero no sustituye la
evaluacion real de expresiones de Realtime Database Rules. El gate pendiente es
`TEST-INFRA-E2E-EMULATOR-001`.

## Verificacion autoritativa pendiente

El cliente puede confirmar que una escritura publica fue leida de vuelta y
marcar el trabajo como `CLIENT_CONFIRMED`. Esa evidencia no es autoritativa:
`VERIFIED` queda reservado para un futuro proceso servidor confiable con
identidad no falsificable. Hasta implementar ese servicio, la interfaz no debe
presentar la confirmacion cliente como verificacion oficial.

## Worker ejecutado por cliente

No existe un proceso servidor siempre activo. El trabajo sobrevive al cierre del
navegador original y otro cliente autorizado puede recuperarlo, pero el retry se
ejecuta cuando una aplicacion autorizada esta abierta. No hay garantia de
latencia mientras ningun cliente autorizado esta conectado.

## Concurrencia oficial pendiente

Este ticket hace idempotente la proyeccion, no resuelve completamente dos
publicaciones oficiales concurrentes ni la autoridad del ledger. Esa
responsabilidad corresponde a `OFFICIAL-SCORE-CONCURRENCY-001`.

## Correcciones legacy

Una correccion creada por el flujo nuevo genera un nuevo trabajo y supersede el
anterior. Datos legacy sin outbox se siguen proyectando por compatibilidad, pero
no reciben historicamente un trabajo retroactivo.

## Permisos temporalmente inconsistentes

`permission-denied` se clasifica como recuperable porque puede deberse a un
desfase de deploy o perfil. Despues de cinco intentos llega a `DEAD_LETTER` y
requiere intervencion.

## Auditoria general

El outbox conserva evidencia de su propia operacion, pero no sustituye la
iniciativa general de auditoria append-only. `AUDIT-IMMUTABILITY-001` permanece
pendiente.

## Historial de cierre

Los trabajos terminales se conservan como evidencia. El cliente no puede
reescribir un cierre `CLIENT_CONFIRMED` como `VERIFIED`, ni borrar la intencion
inmutable o sustituir sus actores. Cualquier verificacion autoritativa futura
debera ser aditiva, trazable y emitida por servidor.

## Estado del programa

- CSP-M1 permanece `NO APROBADO`.
- El programa maestro no se modifica en este ticket.
- El siguiente P0 recomendado es `OFFICIAL-SCORE-CONCURRENCY-001`.
