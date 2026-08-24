# Resolution Trace

## Cadena efectiva

`tournament + charreada`

→ `getCharreadaCompetitionContext()` normaliza el tipo mediante `validateCompetitionType()`

→ `getCharreadaScoringSuertes()` construye la firma contextual

→ `getTournamentSuertes()` valida la asignacion activa y resuelve el Rule Profile

→ catalogo FMCH filtrado por los IDs de `equipos_completo`

→ `renderScoring()` presenta las diez suertes.

## Entradas de autoridad

- `charreada.competitionType`
- tipo legacy del torneo solo cuando no existe tipo explicito
- `tournament.ruleProfileAssignment`
- `tournament.ruleProfilePolicy`
- fingerprint y revision de reglas

## Salidas

- Contexto soportado y asignacion activa: catalogo FMCH.
- Asignacion pendiente: no resuelto todavia, `[]` no cacheable.
- Tipo explicito no soportado: vacio protegido.
