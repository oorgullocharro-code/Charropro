# Projection Rules Audit

## Commits preservados

- `1581ac9 fix: allow initial public projection processing`.
- `954aade fix: harden public projection actor rules`.

Ambos forman parte de HEAD, main y origin/main. No se revirtieron ni modificaron.

## Contrato verificado

La regla permite crear el estado inicial solamente como:

```text
PROCESSING
attempts = 1
claimedBy.uid = auth.uid
lastAttemptBy.uid = auth.uid
lease valido
```

En esa creacion inicial, `retriedBy.uid` y `cancelledBy.uid` pueden conservar el
string vacio generado por el normalizador. La excepcion esta limitada a
`!data.exists()` y valor vacio.

Las transiciones sensibles siguen exigiendo actor real:

- un retorno a `PENDING` exige `retriedBy.uid === auth.uid`;
- `CANCELLED` exige supervisor, `cancelledBy.uid === auth.uid`, motivo y fecha;
- un actor no puede sustituir `claimedBy`, `lastAttemptBy`, `retriedBy` o
  `cancelledBy` de otro actor;
- sourceRevision, intent, lease, attempts y transiciones permanecen validados.

## Evidencia automatizada

Las pruebas confirman:

1. torneo sin perfil conserva Product Base;
2. `PROCESSING` inicial acepta actores opcionales vacios;
3. retry no acepta `retriedBy.uid` vacio;
4. cancelacion no acepta `cancelledBy.uid` vacio;
5. actor ajeno es rechazado;
6. cadena `PROCESSING -> PROJECTED -> CLIENT_CONFIRMED` permanece permitida.

## Evidencia productiva de solo lectura

- 39 jobs terminales.
- 34 `CLIENT_CONFIRMED`.
- 5 `SUPERSEDED`.
- 0 jobs pendientes/no terminales.
- Ultima revision confirmada: 49.
- Public projection: schema 2, revision 49, estado `live`.
- `permission_denied`: 0 en los jobs observados.

## Integridad

La modificacion respecto de `ecb432e` esta versionada y probada. No existe el
backup temporal `firebase-rules-auditoria.json.bak-20260814`. Rules no se
modificaron ni desplegaron durante esta auditoria.
