# CHARROPRO-PORTAL-V2-NAVIGATION-PROGRAM-PHASES-AND-COMPETITION-CONTEXT-001

## Scope

Portal V2 now has the approved six-section navigation: Inicio, En vivo, Programa, Resultados, Posiciones, and Sabana. Timeline remains an internal section of En vivo and is not a main navigation item. The legacy `torneo-publico.html` entrypoint is unchanged.

## Canonical Context

- `TOURNAMENT_MODEL=tournament.info`
- `PHASE_MODEL=charreada.phaseId + charreada.phaseName`
- `COMPETITION_MODEL=charreada.competitionId + charreada.competitionName`
- `CHARREADA_MODEL=charreada.id + name + order + status + schedule`
- `PROGRAM_MODEL=canonical V3 program.items`
- `RESULT_SCOPE_MODEL=resolved canonical results by competition, phase, charreada, and participant scope`
- `STANDINGS_SCOPE_MODEL=resolved official ranking scopes supplied by Canonical Tournament Results`
- `SHEET_SCOPE_MODEL=resolved result rows grouped by canonical competition, phase, and charreada context`

`PHASES_ALREADY_SUPPORTED_BY_CHARROPRO=YES` and `COMPETITION_CONTEXT_ALREADY_SUPPORTED=YES`. V3 had partial phase context: the internal canonical model already held labels, but the public adapter exposed only a phase identifier. This ticket adds only the existing public presentation metadata: competition name, phase name, and charreada context. No phase authority, score calculation, ranking calculation, or lifecycle decision was added.

## Presentation Behavior

- Inicio presents tournament identity, lifecycle, venue/date context, navigation actions, and a direct program preview.
- Programa renders only published V3 charreadas in canonical order; it renders team or participant identities only when the public contract provides names.
- Competition and phase selectors appear only when V3 supplies more than one safe, named option. They filter Program, Results, Positions, and Sheet by direct canonical identifiers.
- A phase ID without a public `phaseName` is intentionally not rendered or offered as a selector. Portal V2 does not turn internal IDs into labels.
- A valid deep link preserves `view`, `competition`, `phase`, `tournamentId`, and the local-preview query parameters across refresh/navigation.
- V3 provides no authoritative current-phase field. `currentPhase` remains absent rather than inferred from dates, scores, result counts, or charreada order.

## Real-Data Read-Only Findings

For the reported test tournament `torneo_mtuikefk_jydg3q`, this ticket performed no production read or write. Static code audit establishes these source boundaries:

- `SOURCE_LIFECYCLE_VALUE` is derived by `lifecycleStatus()` from `source.liveCurrent.status`, then `tournament.info.status` / `tournament.status`.
- `CLIENT_RENDER_CORRECT_FOR_SUPPLIED_VALUE=YES`: Portal V2 renders `PRE_EVENT` only when the canonical V3 lifecycle supplies it.
- `FIRST_DIVERGENT_LIFECYCLE_LAYER=liveCurrent/status source before Canonical Public Projection V3` if a live tournament still projects `PRE_EVENT`.
- `TIMELINE_SOURCE_AVAILABLE=only source.publicTimeline`.
- `TIMELINE_EVENTS_GENERATED=NO`: the V3 builder transports sanitized narrative events but does not synthesize them from publications or results.
- `FIRST_DIVERGENT_TIMELINE_LAYER=publicTimeline producer before Canonical Public Projection V3` if scores exist while `timeline.items` remains empty.

Both are separate source/publisher concerns. Portal V2 does not infer lifecycle or manufacture timeline events from results.

## Boundaries

- `SPORTING_RECALCULATION_PRESENT=NO`
- `PRIVATE_DATA_EXPOSURE=0`
- `PRODUCTION_READS=0`
- `PRODUCTION_WRITES=0`
- `DEPLOY=NO`
- Rules, Functions runtime deployment, Firebase data, scoring, ranking authority, Timer, Rule Profiles, and legacy portal remain outside this ticket.

## Local Preview

`http://127.0.0.1:8766/portal-v2.html?tournamentId=portal-v2-local-preview&charroproEnv=local&portalV2Fixture=live`

Use `&view=programa`, `&competition=equipos-local`, and `&phase=fase-unica` only when the fixture/public snapshot exposes that named context.
