# Scorer 2026 Preservation Contract

## Proposito

Este contrato regula cualquier cambio posterior al calificador de CharroPro. Su base es
el commit `fc225a848ef738d56cc9567979333d3ada57ee62` y la auditoria funcional de las diez
suertes y 239 FieldID.

La prioridad obligatoria es:

`REUTILIZAR -> EXTENDER -> CORREGIR -> REFACTORIZAR -> CREAR SOLO SI REUTILIZAR ES IMPOSIBLE`

## Invariantes de dominio

1. Los IDs de suerte, regla, intento, score y FieldID no se reutilizan ni cambian sin
   migracion versionada.
2. Ningun cambio 2026 altera retroactivamente scores oficiales o historicos.
3. Los valores deportivos se calculan una sola vez mediante el motor oficial vigente.
4. Resultados, Portal y Broadcast consumen datos oficiales; no crean motores paralelos.
5. La competencia activa define participantes y suertes. Legacy conserva su fallback.
6. Equipo e individuo nunca se convierten silenciosamente uno en otro.
7. Cero, `false`, cadena vacia y `null` valido no se interpretan como ausencia.

## Invariantes del intento

El modelo actual preserva, como minimo:

```json
{
  "base": 0,
  "adic": 0,
  "infr": 0,
  "puntaPts": 0,
  "puntaMetros": 0,
  "puntaPiquetes": 1,
  "tiempo": "",
  "desc": null,
  "applied": [],
  "customAdic": [],
  "customInfr": [],
  "teamPenalties": [],
  "attempted": false,
  "notAchieved": false,
  "initializedBase": false,
  "note": "",
  "timeEvidence": []
}
```

`timeEvidence` se agrega de forma dinamica, pero forma parte del contrato publicado
cuando existe. Una futura V2 puede normalizar el modelo, nunca descartar estos datos.

## Contrato de DQ

El comportamiento futuro aceptable debe:

- poner en cero los puntos buenos aplicables;
- conservar infracciones individuales de catalogo y manuales;
- conservar infracciones al equipo;
- conservar evidencia y notas;
- conservar motivo de DQ y trazabilidad;
- evitar colisiones de identidad como `ttm`;
- definir explicitamente si quitar DQ restaura o no los puntos previos.

El comportamiento actual cumple la preservacion de infracciones numericas, equipo,
evidencia y notas. No se autoriza “corregir” DQ borrando esos campos.

## Contrato de reglas y botonera

- El catalogo base vive en `js/data/suertes.js` y `js/data/calaRules.js`.
- Overrides globales y de torneo extienden/ocultan reglas sin cambiar IDs historicos.
- El editor mantiene grupos `base`, `adic`, `infr` y `desc`.
- Penalizaciones de equipo permanecen separadas del catalogo individual.
- Layouts visuales solo controlan visibilidad, grupo, orden, etiqueta corta, icono y
  confirmacion; no cambian puntajes.
- Adicionales e infracciones manuales preservan motivo, puntos e identidad propia.

## Contrato de calculo

- Intento: `base + adic + puntaPts - infr`.
- DQ: total deportivo del intento igual a cero.
- Penalizacion de equipo: resta separada mediante `teamPenalties`.
- Coleadero: suma de oportunidades por coleador y luego de coleadores.
- Terna: Lazo y Pial en el Ruedo permanecen colecciones independientes y se componen al
  exportar/resultar.
- Punta Cala: calculador especializado preservado; sin limites arbitrarios nuevos.

Todo cambio de formula requiere especificacion FMCH aprobada, fixture anterior/nuevo y
version de regla. Este ticket no autoriza ninguno.

## Contrato de persistencia y autoridad

La cadena obligatoria es:

`DRAFT -> SAVE LOCAL -> SNAPSHOT -> OFFICIAL TRANSACTION -> LEDGER/HISTORY -> FANOUT -> PUBLIC SNAPSHOT`

Debe conservarse:

- `attemptKey` estable por torneo, charreada, entrada, suerte, oportunidad y coleador;
- `idempotencyKey`, `expectedRevision`, fingerprint y dispositivo;
- una sola revision activa por intento;
- historial inmutable de correcciones;
- auditoria con actor y `auth.uid`;
- transaccion server-side y rechazo atomico de conflictos;
- retry seguro;
- fanout reintentable sin duplicar autoridad;
- Outbox durable para proyeccion publica;
- prohibicion de reemplazo masivo destructivo de `scores`, `publishedScores`, ledger o
  auditoria;
- normalizacion Firebase-safe y validacion del snapshot;
- guard de identidad remota antes de publicar estado compartido.

## Contrato de UI y operacion

- Login, roles, seleccion de torneo/charreada/suerte/turno deben seguir visibles.
- Acciones criticas no pueden ocultarse por un cambio responsive.
- `Guardar y siguiente` solo avanza despues de publicacion exitosa.
- El borrador no se publica por navegar.
- El footer debe seguir accesible en desktop e iPad.
- No se acepta nuevo scroll horizontal estructural. Los strips horizontales actuales son
  deuda registrada y deben reducirse de forma compatible.
- Datos reales de equipo, charro, caballo y participante tienen prioridad sobre
  placeholders.

### Contrato del footer y de los mocks

- Los mocks 2026 describen jerarquia y presentacion; no autorizan eliminar funciones.
- Deben preservarse el estado de guardado, Deshacer, Marcar 0 y Guardar y siguiente.
- Evidencia y Nota de juez deben conservarse aunque actualmente vivan fuera del footer.
- `persistScoreChange()` conserva el borrador automaticamente; no se inventara un boton
  separado `Guardar` sin definir primero su contrato frente a publicacion y avance.
- La semantica actual de Deshacer es navegacion al puntero anterior, no undo por evento.
  El control no puede desaparecer mientras se define una correccion compatible.
- `Pendiente a revision` no esta localizado en la historia Git disponible. Solo podra
  recuperarse cuando exista evidencia verificable de estado, persistencia, permisos,
  impacto en score oficial y comportamiento en Resultados.
- La UI futura puede reorganizar controles para iPad portrait/landscape, pero no ocultar
  ni retirar capacidades confirmadas.

## Contrato de integraciones

| Integracion | Regla de preservacion |
| --- | --- |
| Resultados | Lee el motor actual y la competencia activa; no recalcula reglas. |
| Audit | Conserva eventos y revisiones; no elimina historico. |
| Public Snapshot | Se deriva de Outbox/fuente oficial; nunca de datos privados directos. |
| Broadcast | Consume contrato sanitizado; no escribe score. |
| Recovery | Respalda/restaura sin reactivar fanout obsoleto ni perder ledger. |
| FMCH | FieldID permanecen estables; conversiones se versionan y documentan. |

## Cambios incompatibles

Un cambio que toque ID, formula, esquema oficial, historial o autoridad requiere:

1. ticket independiente;
2. especificacion deportiva aprobada;
3. migracion y rollback;
4. pruebas de compatibilidad sobre scores existentes;
5. pruebas de concurrencia e idempotencia;
6. reconciliacion de los 239 FieldID;
7. validacion visual iPad portrait, iPad landscape y desktop;
8. autorizacion antes de commit, push o deploy.

Reemplazar un componente funcional solo porque seria mas facil no es una justificacion.

## Gate minimo para tickets 2026

Antes de aprobar cada cambio deben pasar:

- pruebas de la suerte afectada;
- `cala-rules`, `team-penalties-zero`, concurrencia oficial y Public Projection;
- suite completa vigente;
- `node --check` para JS/MJS afectados;
- JSON valido;
- `git diff --check`;
- prueba de no mutacion/historial;
- confirmacion de cero escritura en Produccion salvo ticket de despliegue autorizado;
- comparacion contra `SCORER_2026_FREEZE_LIST.md`.
