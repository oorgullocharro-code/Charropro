# CHARROPRO-PENDING-REVIEW-AND-FULL-SCORER-INTEGRATION-001

## Resultado

Se implemento el workflow `pending_review` sobre el scorer existente. La auditoria historica de codigo, documentacion, commits y referencias recuperables no encontro una implementacion deportiva previa que pudiera extenderse. No se creo una autoridad de publicacion paralela.

## Flujo final

1. El juez captura un intento normal.
2. `Pendiente` conserva el score collection completo y su representacion Attempt V2 draft.
3. La transaccion crea un unico registro pendiente y el scorer avanza con `advanceScoringPointer()`.
4. La lista del torneo permite abrir la pendiente sin anidar otra resolucion.
5. Antes de abrirla se conserva el puntero y el borrador exacto del contexto operativo actual.
6. El juez modifica o completa el draft pendiente.
7. `Resolver y publicar` reutiliza `publishOfficialScoreForContext()` y la proteccion oficial existente.
8. Solo despues del exito oficial el registro cambia a `resolved` mediante CAS.
9. El scorer restaura exactamente torneo, competencia, charreada, equipo o participante, suerte, oportunidad, coleador y borrador previo.

## Integracion

- Estado canonico: `state.pendingScoreReviews`.
- Contrato puro y seguro: `js/core/pendingScoreReview.js` v1.0.0.
- Persistencia remota: RTDB transaction por `pendingId` con `expectedRevision`.
- Suscripcion dedicada: las actualizaciones entre dispositivos no dependen de `tournament.meta.updatedAt`.
- Recuperacion por pestana: una identidad estable en `sessionStorage` permite recargar la pestana que abrio la pendiente sin activar la misma resolucion en otras pestanas del dispositivo.
- Guardado generico del torneo: excluye el namespace transaccional de pendientes.
- Roles: Juez y Supervisor reciben capacidad `score`; Operador no recibe permiso en Rules.
- Timer: marcar pendiente no emite comandos ni pausa la autoridad temporal.
- Terna: no reserva ni consume oportunidad hasta la publicacion oficial.
- Publicacion, Outbox, Recovery y Score Protection: permanecen en la ruta canonica existente.

## Version

Token unico: `20260811-pending-review-full-scorer-integration-001-v1`.

La configuracion canonica conserva integridad con SHA-256 `612e1f0dfd312f2f2ca460e8a4fc7dc86b534556221456f35c145acf293de3dd`.

## Limites preservados

No se modificaron valores FMCH, Rule Profile `FMCH_2026_LIBRE 0.6.0`, Attempt V2, calculos, historicos, Timer Engine, Portal Publico ni Broadcast. Los bloqueos documentales de Cala, cuarta fila de Coleadero y USI-003 permanecen fuera de alcance.

No hubo push, deploy ni escrituras a Firebase Production.
