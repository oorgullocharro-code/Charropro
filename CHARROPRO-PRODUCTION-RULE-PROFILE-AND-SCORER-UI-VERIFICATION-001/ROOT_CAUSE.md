# Root Cause

## Dictamen tecnico

El scorer de Produccion no perdio la botonera FMCH. El torneo
`torneo_msse2f1n_ogcwk8` no tiene una seleccion explicita de Rule Profile en el
torneo, la charreada ni la competencia. El resolver recibe una seleccion vacia
y, por contrato, utiliza `PRODUCT_BASE` con `fallbackUsed: false`.

La evidencia oficial coincide con esa resolucion:

- `ruleProfileId: null`;
- `ruleProfileVersion: null`;
- `ruleProfileStatus: product_base`;
- `layers: ["PRODUCT_BASE"]`;
- reglas seleccionadas con `source: PRODUCT_BASE`.

## Causas comprobadas

| Hipotesis | Resultado | Evidencia |
| --- | --- | --- |
| A. El torneo no tiene perfil | SI | `info`, `settings` y raiz del torneo no contienen campos de perfil |
| B. La charreada no tiene perfil | SI | `charreada_msse332f_bng8pl` no contiene perfil, fallback ni fingerprint |
| C. El perfil existe pero esta en draft | SI, en producto | `FMCH_2026_LIBRE` 0.6.0 tiene `status: draft`; no esta asignado al torneo |
| D. `activationReady:false` impide su uso | Indirectamente | Es el bloqueo de gobierno; el resolver bloquea por `status: draft` |
| E. El resolver rechaza perfiles no activos | SI | Solo `active` y `deprecated` son seleccionables |
| F. La creacion comercial no hereda perfil | SI | La asignacion automatica FMCH existe solo para Local/Emulator |
| G. Falta la UI aprobada | NO | La UI consume el catalogo efectivo y los componentes FMCH siguen en codigo |

## Resolucion exacta

```text
Torneo sin ruleProfileId/ruleProfileVersion
  -> resolveRuleProfileSelection()
  -> profile: null
  -> status: product_base
  -> resolveEffectiveRules()
  -> layers: PRODUCT_BASE
  -> scorer usa la botonera PRODUCT_BASE
```

No hubo fallback por error. La ausencia total de seleccion es un caso valido y
distinto de `ruleProfileFallback: "product_base"`.

## Por que no se corrigio Produccion

`FMCH_2026_LIBRE` 0.6.0 declara:

- `status: draft`;
- `activationReady: false`;
- tres bloqueos de fuente: equivalencias de Cala, cuarta fila de Coleadero y
  doble identidad de Contra mascara.

El producto no tiene un estado `validated`, un servicio de activacion ni una UI
de asignacion comercial. Cambiar manualmente el perfil embebido a `active`
replicaria un helper expresamente limitado a fixtures Local/Emulator y eludiria
los bloqueos deportivos. Por ello no se creo torneo de prueba ni score nuevo.

## Dictamen

`BLOQUEADO` para activar o asignar FMCH 0.6.0 en Produccion. No existe defecto de
render ni perdida de botones; falta cerrar el lifecycle deportivo y la frontera
productiva de asignacion.

## Readiness final

La evidencia ubica el sistema en una combinacion de escenarios:

- Escenario A: la app comercial ya contiene los componentes necesarios para
  representar FMCH 0.6.0.
- Escenario B: la politica temporal FMCH de Toro/Terna y el no solapamiento de
  Paso siguen pendientes.
- Dependencia D: no existe lifecycle administrativo `DRAFT -> VALIDATED ->
  ACTIVE`, assignment auditado ni bloqueo tecnico de `activationReady:false`.

Por tanto:

```text
SCORER UI READY FOR FMCH PROFILE: YES
SPORTING CATALOG COMPLETE: NO
TEMPORAL POLICY COMPLETE: NO
SAFE FOR PRODUCTION: NO
```
