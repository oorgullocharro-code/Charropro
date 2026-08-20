# Rule Profile Binding Contract

## Perfil auditado

| Campo | Valor |
| --- | --- |
| `profileId` | `FMCH_2026_LIBRE` |
| `version` | `0.6.0` |
| `status` | `draft` |
| `activationReady` | `false` |
| `environment` | no declarado en el perfil de producto |
| Reglas | 731 |
| Suertes cargadas | 10 |

Motivo de bloqueo declarado:

> Cala ML/CR frente a MD/MI/PC, cuarta fila de Coleadero y doble identidad
> Contra mascara requieren confirmacion de fuente.

## Estados y seleccion

El contrato enumera `skeleton`, `draft`, `active`, `deprecated` y `archived`.
Solo `active` y `deprecated` son utilizables por el resolver. No existe un
estado `validated`.

Resultados deterministas del resolver:

| Entrada | Resultado |
| --- | --- |
| Sin referencia | Product Base valido; sin fallback |
| FMCH 0.6.0 draft | Bloqueado con `profile-not-available-for-scoring` |
| FMCH draft + fallback explicito | Product Base con `fallbackUsed: true` y diagnostico |

El torneo productivo corresponde al primer caso, no al tercero.

## Mecanismo previsto

1. La definicion y version viven en `js/data/ruleProfiles.js`.
2. La seleccion vive en `tournament.ruleProfileId` y
   `tournament.ruleProfileVersion`.
3. Un fallback solo es valido si el torneo declara
   `ruleProfileFallback: "product_base"`.
4. El score conserva perfil, version, capas y fingerprint; cambiar el perfil no
   recalcula historicos.
5. El merge es Product Base -> Rule Profile -> override de torneo.

## Brecha de lifecycle

No existe actualmente:

- servicio o callable de validacion deportiva;
- transicion controlada `draft -> active`;
- asignacion UI/API por torneo;
- auditoria de actor para activacion/asignacion;
- CAS o revision lock especifico para la asignacion;
- scope productivo de prueba que permita activar 0.6.0 sin promoverlo globalmente.

La unica promocion automatica conocida clona 0.6.0, cambia su estado a `active`
y lo asigna cuando el runtime es Local/Emulator. Esa copia declara
`fixtureOnly: true`, `environment: local-emulator` y conserva
`activationReady: false`. No se ejecuta en Produccion.

## Compatibilidad historica

La estrategia de versionado existente es apta para no alterar torneos
historicos: estos conservan la referencia exacta y cada score conserva su
snapshot de reglas. La brecha esta antes de esa frontera, en certificar y
asignar una version para uso comercial.

## Recomendacion

Crear un ticket separado que:

1. cierre las tres decisiones deportivas bloqueantes;
2. publique una version nueva e inmutable con estado seleccionable;
3. implemente asignacion explicita y auditada por torneo;
4. impida activar perfiles con `activationReady: false`;
5. permita un scope de prueba productivo sin fallback cruzado;
6. preserve torneos y scores existentes.

No es seguro reutilizar el helper Local/Emulator en Produccion.

## Autoridad actual

| Operacion | Autoridad implementada hoy |
| --- | --- |
| Crear perfil | Desarrollador mediante modulo versionado; no existe UI/API runtime |
| Validar estructura | `validateRuleProfile()`; no certifica decisiones deportivas |
| Validar deporte | Evidencia documental/Comision; no existe transicion ejecutable |
| Activar | Cambio versionado de `status`; no existe servicio administrativo |
| Asignar | Campos del objeto torneo; no existe comando auditado de asignacion |
| Archivar/deprecar | Estado declarativo versionado; no existe workflow runtime |

El resolver no verifica `metadata.activationReady`. Solo verifica que el estado
sea `active` o `deprecated`. Esto significa que marcar manualmente como `active`
un perfil con `activationReady:false` eludiria el control documental. Esa brecha
debe cerrarse antes de ofrecer assignment productivo.

## Binding minimo actual

```json
{
  "ruleProfileId": "FMCH_2026_LIBRE",
  "ruleProfileVersion": "0.6.0"
}
```

Este binding es suficiente tecnicamente solo cuando la version registrada esta
`active` o `deprecated`. No debe usarse con 0.6.0 mientras siga `draft`.

## Binding productivo recomendado

La futura operacion administrativa debe escribir atomicamente en el torneo:

- `ruleProfileId`;
- `ruleProfileVersion`;
- fingerprint inmutable de la definicion;
- estado observado al asignar;
- `assignedAt` de servidor;
- `assignedBy.uid` y rol;
- referencia previa;
- revision/CAS de configuracion.

Debe rechazar:

- perfiles `skeleton`, `draft` o `archived`;
- `activationReady !== true`;
- version o fingerprint desconocido;
- cambio despues de iniciar competencia sin politica explicita;
- mezcla de tenant/organization/tournament;
- actualizacion sin actor, auditoria o revision esperada.

No debe duplicar las 731 reglas dentro del torneo. La referencia exacta y su
fingerprint son suficientes si el registry versionado es inmutable.

## Cambio despues de iniciar competencia

El sistema preserva perfil/version/fingerprint dentro de Attempt V2 y el
rulebook del score. Los scores historicos no se recalculan. Sin embargo, cambiar
el perfil a mitad de una competencia produciria una charreada con intentos bajo
catalogos distintos. Hoy no existe compatibility check ni politica para esa
transicion. La operacion futura debe bloquearla cuando haya scores oficiales,
salvo migracion administrativa separada, explicita y auditada.

## Criterios de activacion pendientes

1. Resolver las equivalencias impresas de Cala.
2. Resolver la cuarta fila de Coleadero.
3. Resolver la identidad de Contra mascara.
4. Completar politica temporal Toro/Terna.
5. Completar no solapamiento de timers de Paso.
6. Registrar certificacion deportiva y checksum.
7. Implementar lifecycle y assignment con CAS/auditoria.
8. Validar una version nueva e inmutable en torneo de ensayo.
