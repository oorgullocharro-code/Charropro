# Production Rule Profile Audit

## Fuente auditada

- Proyecto: `charropro-e8a68`.
- Torneo: `torneo_msse2f1n_ogcwk8` (`millonario prueba`).
- Charreada: `charreada_msse332f_bng8pl` (`Charreada 1`).
- Lecturas: solo consulta mediante Firebase CLI.
- Escrituras a Produccion: 0.

El CLI emitio una advertencia de credenciales vencidas y de update-check local,
pero devolvio las lecturas solicitadas. La traza fue contrastada con el scorer
autenticado en navegador y con los scores oficiales, por lo que la advertencia
no cambia el diagnostico; debe renovarse la sesion del CLI antes de cualquier
operacion administrativa futura.

## Torneo

| Campo | Valor |
| --- | --- |
| `id` | `torneo_msse2f1n_ogcwk8` |
| `type` | `completo` |
| `status` | `preparacion` |
| `activeCharreadaId` | `charreada_msse332f_bng8pl` |
| `ruleProfileId` | ausente |
| `ruleProfileVersion` | ausente |
| `ruleProfile` | ausente |
| `ruleProfileFallback` | ausente |

`settings` tampoco contiene campos de Rule Profile. La raiz del torneo no
contiene un nodo alterno de perfiles o competencias.

## Charreada y competencia

| Campo | Valor |
| --- | --- |
| `competitionId` | `equipos_completo` |
| `competitionType` | `equipos_completo` |
| `competitionScope` | `team` |
| `category` | ausente |
| `phase` | `Fase 1` |
| `status` | `en_vivo` |
| `ruleProfileId` | ausente |
| `ruleProfileVersion` | ausente |
| `ruleProfileFallback` | ausente |
| `effectiveRulesFingerprint` | ausente en la charreada |

## Perfil efectivo

```text
TOURNAMENT PROFILE: none
CHARREADA PROFILE: none
COMPETITION PROFILE: none
INHERITANCE SOURCE: no explicit selection
EFFECTIVE PROFILE: PRODUCT_BASE
EFFECTIVE VERSION: none
FALLBACK USED: false
```

El fingerprint se conserva por score/suerte. En los registros de Cala
inspeccionados es `rules_d5014e8ef1e9407e`; en el Pial en el Ruedo reproducido
es `rules_6dbcb596c339d452`.

## Scores oficiales existentes

Se identificaron dos intentos de Cala. Cada intento conserva una revision
historica y una revision oficial activa:

| Intento | Revision historica | Revision activa | Total | Perfil |
| --- | --- | --- | --- | --- |
| Equipo A, Cala 0 | 1 | 2 | 43 | `product_base` |
| Equipo B, Cala 0 | 1 | 2 | 23 | `product_base` |

Las revisiones historicas estan marcadas `officialStatus: historical` y
`superseded: true`; las revisiones 2 estan activas. Las cuatro conservan:

- `ruleProfileId: null`;
- `ruleProfileVersion: null`;
- `ruleProfileStatus: product_base`;
- `layers: ["PRODUCT_BASE"]`;
- `baseSelection.source: PRODUCT_BASE`;
- `additionalSelections[*].source: PRODUCT_BASE`.

No se reescribio ningun score ni su historial.

## Integridad de publicacion

- Outbox: 39 jobs.
- `CLIENT_CONFIRMED`: 34.
- `SUPERSEDED`: 5.
- Jobs no terminales: 0.
- Ultima revision confirmada: 49.
- Proyeccion publica: schema 2, `projectionRevision: 49`, estado `live`.

La cadena Official Score, fanout, Outbox y proyeccion publica se mantuvo sin
cambios.

## Restricciones de entorno y tenancy

El perfil canonico no declara restricciones de tenant, organization o
environment. Esa ausencia no lo vuelve productivo: su estado `draft` impide la
seleccion normal. El helper que lo vuelve `active` agrega explicitamente
`fixtureOnly: true` y `environment: local-emulator`; no se ejecuta fuera de
Local/Emulator.

No existe un registry productivo por tenant u organizacion. Los perfiles estan
versionados como codigo de producto y el torneo solo puede guardar su referencia
o un perfil embebido.

## Herencia efectiva

`getCharreadaScoringSuertes()` resuelve el catalogo desde el objeto torneo. La
charreada aporta `competitionType`, `competitionId`, alcance y `suerteIds`, pero
no aporta otra seleccion de perfil. En la implementacion actual:

```text
tournament.ruleProfileId + tournament.ruleProfileVersion
  -> catalogo completo del torneo
  -> filtro por suerteIds de la competencia/charreada
```

Por ello todas las charreadas y competencias del torneo heredan el perfil del
torneo. No existe override de perfil por competencia o charreada.

## Conclusion productiva

PRODUCTION CURRENT PROFILE: `PRODUCT_BASE`.

CURRENT PROFILE SOURCE: ausencia valida de seleccion explicita.

EXPECTED FOR FUTURE TEST: `FMCH_2026_LIBRE` 0.6.0, solo despues de certificar y
activar una version apta.
