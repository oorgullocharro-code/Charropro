# Modelo de Competencias Internas del Torneo

## 1. Problema actual

Hoy CharroPro usa el `type` del torneo para definir las suertes disponibles en todo el torneo.

Ejemplos actuales:

- `completo`: todas las suertes.
- `caladero`: solo Cala.
- `coleadero`: solo Colas.
- `pialadero`: solo Piales.

Este modelo funciona para torneos especializados simples, pero no representa completamente la operacion real de muchos eventos charros. Un mismo evento puede tener varias competencias internas con reglas de ranking, premiacion y estadistica separadas.

Ejemplo real:

- Charreadas por equipos.
- Charro Completo.
- Caladero.
- Coleadero.
- Pialadero.
- Exhibiciones.

Si todo depende solamente de `tournament.type`, existe riesgo de mezclar resultados que no deben sumarse entre si. Por ejemplo, una calificacion de Caladero dentro del evento no debe alterar el ranking por equipos si pertenece a una competencia individual. Del mismo modo, Charro Completo no debe contaminar la tabla general por equipos.

CharroPro necesita un modelo donde el torneo sea el contenedor general y dentro existan competencias internas independientes.

## 2. Conceptos principales

### Torneo / Evento

Es el contenedor general de operacion, produccion, programa, resultados y pagina publica.

Ejemplo:

```text
Millonario THV 2026
```

El torneo puede incluir una o varias competencias internas. El torneo conserva datos generales:

- Nombre.
- Sede.
- Temporada.
- Organizador.
- Fechas.
- Patrocinadores.
- Programa general.
- Configuracion de transmision.

### Competencia interna

Es un bloque competitivo independiente dentro del torneo.

Ejemplos:

- Competencia por equipos.
- Charro Completo.
- Caladero.
- Coleadero.
- Pialadero.
- Exhibicion.

Cada competencia interna define:

- Que suertes se califican.
- Si compiten equipos o participantes individuales.
- Como se calcula ranking.
- A que premiacion pertenece.
- Si afecta estadisticas generales.
- Si es publica.

### Jornada / Charreada

Es una unidad de programa donde compiten equipos o participantes.

Una jornada o charreada puede pertenecer a una competencia interna.

Ejemplos:

- Charreada 1 de Competencia por equipos.
- Jornada 2 de Pialadero.
- Caladero del viernes.
- Final de Charro Completo.

La palabra visible puede seguir siendo `Charreada`, `Jornada`, `Ronda`, `Semifinal` o `Final`, segun la operacion del evento.

### Participante

El participante es la entidad que compite dentro de una competencia.

Puede ser:

- Equipo.
- Charro individual.
- Escaramuza.
- Invitado.
- Participante de exhibicion.

El tipo de participante depende de `scope`.

## 3. Campos propuestos

Cada competencia interna debe tener una estructura canonica:

```json
{
  "competitionId": "comp_abc123",
  "tournamentId": "torneo_abc123",
  "name": "Pialadero Abierto",
  "type": "pialadero",
  "scope": "individual",
  "suerteIds": ["piales"],
  "rankingMode": "single_suerte",
  "awardGroup": "pialadero",
  "affectsTeamRanking": false,
  "affectsGeneralStatistics": false,
  "publicVisibility": true,
  "status": "programada"
}
```

### `competitionId`

Identificador unico de la competencia interna. No debe depender del nombre visible.

### `tournamentId`

Torneo/evento al que pertenece la competencia.

### `name`

Nombre visible de la competencia.

Ejemplos:

- `Competencia por Equipos`
- `Charro Completo`
- `Caladero Abierto`
- `Pialadero Infantil`

### `type`

Tipo canonico de competencia.

Ejemplos:

- `equipos_completo`
- `charro_completo`
- `caladero`
- `coleadero`
- `pialadero`
- `exhibicion`

### `scope`

Define la unidad competitiva principal.

Valores sugeridos:

- `team`
- `individual`
- `exhibition`

### `suerteIds`

Lista exacta de suertes calificables para la competencia.

El calificador debe usar esta lista para decidir que suertes mostrar.

### `rankingMode`

Define como se ordenan resultados.

Valores sugeridos:

- `team_total`
- `individual_total`
- `single_suerte`
- `none`

### `awardGroup`

Grupo de premiacion al que pertenece.

Ejemplos:

- `equipos`
- `charro_completo`
- `caladero`
- `coleadero`
- `pialadero`
- `none`

### `affectsTeamRanking`

Indica si los resultados de esta competencia se suman al ranking general por equipos.

### `affectsGeneralStatistics`

Indica si los resultados alimentan estadisticas generales del torneo o deben mantenerse separados.

### `publicVisibility`

Indica si la competencia aparece en pagina publica.

### `status`

Estado operativo de la competencia.

Valores sugeridos:

- `programada`
- `en_vivo`
- `finalizada`
- `suspendida`
- `cancelada`

## 4. Tipos de competencia iniciales

### `equipos_completo`

Competencia oficial por equipos con charreada completa.

```json
{
  "type": "equipos_completo",
  "scope": "team",
  "suerteIds": [
    "cala",
    "piales",
    "colas",
    "toro",
    "terna",
    "yegua",
    "manganas_pie",
    "manganas_caballo",
    "paso"
  ],
  "rankingMode": "team_total",
  "awardGroup": "equipos",
  "affectsTeamRanking": true,
  "affectsGeneralStatistics": true,
  "publicVisibility": true
}
```

Reglas:

- Alimenta ranking general por equipos.
- Alimenta sabana por equipos.
- Alimenta estadisticas generales del torneo.
- Puede tener varias fases: clasificatoria, semifinal, final.

### `charro_completo`

Competencia individual para Charro Completo.

```json
{
  "type": "charro_completo",
  "scope": "individual",
  "suerteIds": [
    "cala",
    "piales",
    "colas",
    "toro",
    "manganas_pie",
    "manganas_caballo",
    "paso"
  ],
  "rankingMode": "individual_total",
  "awardGroup": "charro_completo",
  "affectsTeamRanking": false,
  "affectsGeneralStatistics": false,
  "publicVisibility": true
}
```

Importante:

Charro Completo no incluye Jineteo de Yegua.

Reglas:

- No suma al ranking por equipos.
- Debe tener ranking propio.
- Debe tener sabana propia.
- Debe alimentar estadisticas individuales.
- Puede alimentar estadisticas generales solo si existe una categoria separada.

### `caladero`

Competencia especializada de Cala.

```json
{
  "type": "caladero",
  "scope": "individual",
  "suerteIds": ["cala"],
  "rankingMode": "single_suerte",
  "awardGroup": "caladero",
  "affectsTeamRanking": false,
  "affectsGeneralStatistics": false,
  "publicVisibility": true
}
```

Notas:

- `scope` puede ser `individual` o `team` segun configuracion del evento.
- No debe afectar ranking por equipos salvo que se configure explicitamente.

### `coleadero`

Competencia especializada de Colas.

```json
{
  "type": "coleadero",
  "scope": "individual",
  "suerteIds": ["colas"],
  "rankingMode": "single_suerte",
  "awardGroup": "coleadero",
  "affectsTeamRanking": false,
  "affectsGeneralStatistics": false,
  "publicVisibility": true
}
```

Notas:

- Puede usar participantes individuales o equipos segun configuracion.
- Debe tener ranking propio de coleadores.

### `pialadero`

Competencia especializada de Piales.

```json
{
  "type": "pialadero",
  "scope": "individual",
  "suerteIds": ["piales"],
  "rankingMode": "single_suerte",
  "awardGroup": "pialadero",
  "affectsTeamRanking": false,
  "affectsGeneralStatistics": false,
  "publicVisibility": true
}
```

Notas:

- Puede usar participantes individuales o equipos segun configuracion.
- Debe reutilizar reglas oficiales existentes de Piales.
- No debe crear reglas especiales si no existe una necesidad deportiva aprobada.

### `exhibicion`

Bloque no competitivo o de demostracion.

```json
{
  "type": "exhibicion",
  "scope": "exhibition",
  "suerteIds": [],
  "rankingMode": "none",
  "awardGroup": "none",
  "affectsTeamRanking": false,
  "affectsGeneralStatistics": false,
  "publicVisibility": true
}
```

Reglas:

- No afecta ranking.
- No afecta estadisticas oficiales.
- Puede aparecer en programa publico.
- Puede tener graficos o notas de produccion.

## 5. Reglas de separacion

Las competencias internas deben mantenerse separadas por defecto.

Reglas principales:

- Los resultados de Charro Completo no deben sumarse al ranking por equipos.
- Caladero, Coleadero y Pialadero pueden existir dentro del mismo torneo sin mezclarse con equipos.
- Cada competencia interna puede tener su propia sabana.
- Cada competencia interna puede tener su propio ranking.
- Cada competencia interna puede tener su propia premiacion.
- Las estadisticas historicas deben marcar si vienen de competencia oficial por equipos, individual o especial.
- Una competencia con `affectsTeamRanking: false` nunca debe alterar el ranking general por equipos.
- Una competencia con `rankingMode: none` no debe generar ranking deportivo.
- La pagina publica debe separar visualmente competencias cuando exista mas de una.
- Los graficos y OBS deben saber que competencia estan mostrando.

## 6. Relacion con charreadas

Cada charreada o jornada debe poder guardar:

```json
{
  "charreadaId": "charreada_1",
  "competitionId": "comp_equipos_1",
  "competitionType": "equipos_completo",
  "scope": "team",
  "suerteIds": ["cala", "piales", "colas"]
}
```

### Compatibilidad legacy

Si no existe `competitionId`, CharroPro debe usar el modelo actual:

- `tournament.type` define las suertes.
- `tournament.type` define si es torneo completo, caladero, coleadero o pialadero.

Regla:

No se debe romper ningun torneo existente.

## 7. Relacion con calificador

El calificador debe decidir las suertes disponibles usando este orden:

1. `charreada.suerteIds`, si existen.
2. `competition.suerteIds`, si existe `competitionId`.
3. `tournament.suerteIds`, si existe.
4. Catalogo legacy por `tournament.type`.

Este orden permite:

- Charreadas especiales dentro de una competencia.
- Competencias internas con suertes propias.
- Torneos viejos funcionando sin migracion.
- Pialadero actual funcionando como tipo de torneo.

El calificador no debe inferir suertes desde el nombre de la charreada.

## 8. Relacion con resultados

Resultados debe poder mostrar bloques separados:

- General por equipos.
- Charro Completo.
- Caladero.
- Coleadero.
- Pialadero.
- Exhibiciones, si aplica.

Cada bloque debe tener:

- Ranking propio.
- Sabana propia.
- Total propio.
- Premios propios.
- Filtros por fase o jornada.

La tabla general por equipos solo debe incluir competencias con:

```json
{ "affectsTeamRanking": true }
```

El ranking de Pialadero solo debe considerar scores de la competencia `pialadero`.

## 9. Relacion con estadisticas

Las estadisticas deben incluir un campo `statsScope`.

Valores sugeridos:

- `team`
- `individual`
- `special`
- `exhibition`

### `statsScope: team`

Resultados oficiales por equipo.

Ejemplos:

- Competencia por equipos.
- Ranking general por equipos.

### `statsScope: individual`

Resultados individuales.

Ejemplos:

- Charro Completo.
- Pialadero individual.
- Caladero individual.

### `statsScope: special`

Competencias especiales o independientes.

Ejemplos:

- Coleadero por invitacion.
- Pialadero nocturno.
- Caladero femenil.

### `statsScope: exhibition`

Exhibiciones que no alimentan estadisticas oficiales.

Charro Completo debe alimentar estadisticas individuales, no ranking de equipos.

## 10. Relacion con Event Engine

Los eventos futuros deben incluir campos de competencia:

```json
{
  "competitionId": "comp_abc123",
  "competitionType": "pialadero",
  "competitionScope": "individual",
  "awardGroup": "pialadero"
}
```

Eventos como `SCORE_PUBLISHED` deben saber si pertenecen a:

- Equipos.
- Charro Completo.
- Caladero.
- Coleadero.
- Pialadero.
- Exhibicion.

Esto permite:

- Bitacoras filtradas por competencia.
- Auditoria sin mezclar rankings.
- IA con contexto correcto.
- Estadisticas separadas.
- Publicacion publica ordenada.

## 11. Relacion con Master Data

### Participantes individuales

Deben vincularse a:

- `participantId`
- `charroId`
- `horseId`, si aplica.

Ejemplo:

```json
{
  "entryId": "entry_1",
  "participantId": "participant_1",
  "charroId": "charro_1",
  "horseId": "horse_1"
}
```

### Equipos

Deben vincularse a:

- `teamId`

Ejemplo:

```json
{
  "entryId": "entry_team_1",
  "teamId": "team_1"
}
```

### Regla de Master Data

La entidad que compite en una competencia no siempre es un equipo. Por eso el modelo futuro debe distinguir entre:

- Equipo deportivo.
- Participante individual.
- Entrada competitiva.
- Caballo.
- Charro.

## 12. Compatibilidad

CharroPro debe migrar hacia competencias internas sin romper torneos existentes.

Reglas:

- Si un torneo no tiene `competitions`, usar modelo actual.
- Si una charreada no tiene `competitionId`, usar `tournament.type`.
- Pialadero actual sigue funcionando como tipo de torneo.
- Caladero y Coleadero actuales siguen funcionando como tipos de torneo.
- El futuro modelo debe poder migrar sin perdida.
- La migracion no debe recalcular calificaciones historicas.
- La migracion debe preservar IDs de scores.

### Estrategia de migracion sugerida

Para un torneo legacy:

```json
{
  "competitionId": "legacy_default",
  "type": "tournament.type",
  "scope": "team_or_individual",
  "suerteIds": "getTournamentSuertes(tournament)",
  "affectsTeamRanking": true
}
```

Esto permitiria crear una competencia interna por defecto sin cambiar el comportamiento visible.

## 13. Roadmap propuesto

### COMPETITIONS-001 - Catalogo de competencias internas

Crear catalogo oficial de tipos de competencia y normalizadores.

### COMPETITIONS-002 - Selector de competencia en charreada

Agregar selector de competencia al crear/editar charreada o jornada.

### COMPETITIONS-003 - Calificador usa `competition.suerteIds`

Actualizar el calificador para resolver suertes desde charreada, competencia, torneo o legacy.

### COMPETITIONS-004 - Resultados separados por competencia

Separar tablas, rankings, sabanas y premiaciones por competencia interna.

### COMPETITIONS-005 - Pagina publica separada por competencia

Mostrar competencias internas en tabs o bloques publicos independientes.

### COMPETITIONS-006 - Estadisticas por competencia

Agregar `statsScope`, filtros y rankings historicos por tipo de competencia.

## 14. Conclusion del arquitecto

CharroPro debe poder operar un evento completo con multiples competencias internas sin mezclar resultados, rankings, estadisticas ni premiaciones.

El `type` del torneo es suficiente para eventos simples, pero no para eventos comerciales complejos. El siguiente paso arquitectonico es separar el contenedor general del torneo de sus competencias internas.

Con este modelo, CharroPro podra manejar un evento como `Millonario THV 2026` con charreadas por equipos, Charro Completo, Caladero, Coleadero, Pialadero y exhibiciones dentro de la misma operacion, pero manteniendo cada resultado en su contexto correcto.

La regla central debe ser simple: cada score pertenece a una competencia. Si esa competencia no afecta el ranking por equipos, nunca debe sumarse al ranking por equipos. Esta separacion es indispensable para que CharroPro pueda crecer hacia pagina publica profesional, estadisticas historicas, IA, produccion y modelos federados sin comprometer la confianza deportiva.
