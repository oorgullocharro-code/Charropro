# New Charreada Inheritance Audit

## Antes de la correccion

### Torneo

`saveTournament()` guardaba:

- identidad;
- nombre, temporada, fecha y sede;
- tipo;
- overrides;
- premiacion;
- estado.

No guardaba `ruleProfileId`, `ruleProfileVersion` ni `ruleProfile`.

### Competencia / charreada

`saveCharreada()` guardaba:

- `competitionType`;
- `competitionScope`;
- `competitionId`;
- `suerteIds`;
- equipos o participantes;
- fase, sede y estado.

No copiaba el perfil. Esto es correcto para el modelo actual porque `getCharreadaScoringSuertes()` resuelve el torneo padre. El defecto era que el padre creado por UI tampoco tenia perfil.

### Normalizacion y persistencia

`normalizeTournament()` conserva campos no reconocidos mediante spread y normaliza solamente temporada, tipo, premiacion, overrides, botoneras y estado. Por ello un Rule Profile presente sobrevive cache y sincronizacion; no habia una normalizacion que lo eliminara.

## Despues de la correccion

Se agrego una politica pura en `js/core/localRuleProfileDefaults.js`:

1. Solo actua con runtime LOCAL / EMULATOR.
2. Solo actua si no existe seleccion explicita ni fallback explicito.
3. Genera una copia desacoplada del perfil FMCH canonico.
4. Marca la copia `active` y `fixtureOnly` exclusivamente para Emulator.
5. Conserva `activationReady: false`.
6. No muta el torneo de entrada.

`saveTournament()` aplica la politica al objeto nuevo. `saveCharreada()` la aplica al torneo padre solo al crear una charreada nueva, permitiendo recuperar torneos sinteticos locales anteriores como Denver sin alterar ediciones existentes ni decisiones explicitas.

## Prueba real

Se creo en LOCAL / EMULATOR:

| Campo | Valor |
| --- | --- |
| tournamentId | `torneo_mssamn82_w5hmly` |
| torneo | Denver |
| charreadaId | `charreada_mssbcn2o_gj2aw2` |
| charreada | Charreada 3 |
| competitionId | `equipos_completo` |
| equipos | 3 sinteticos |
| perfil heredado | `FMCH_2026_LIBRE` |
| version | `0.6.0` |
| fallback | no |

Al abrir el scorer, Cala ya mostro su catalogo FMCH y Lazo mostro las cuatro bases y el resto del catalogo FMCH. Esto demuestra la herencia real por torneo, no solo un fixture unitario.

## Limite deliberado

La correccion local del torneo padre afecta la resolucion futura de sus charreadas, que es la semantica de configuracion por torneo. No migra produccion, no escribe un perfil en cada charreada y no oculta referencias invalidas.
