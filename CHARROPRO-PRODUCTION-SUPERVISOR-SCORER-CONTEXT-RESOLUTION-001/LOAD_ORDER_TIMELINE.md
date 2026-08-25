# Load Order Timeline

Orden observado y contrato final:

1. `AUTH_READY`
2. `TOURNAMENT_CONTEXT_SELECTED`
3. `TOURNAMENT_READ_STARTED`
4. `TOURNAMENT_READY` o `TOURNAMENT_READ_ERROR`
5. `CHARREADA_READY`
6. `PRODUCTIVE_DEFAULT_RESOLVED`
7. `ASSIGNMENT_READ`
8. `PROFILE_RESOLVED`
9. `SUERTES_RESOLVED`
10. `SCORER_RENDER`

Si una solicitud de assignment esta pending o error, ese estado tiene precedencia sobre la espera remota generica. La prueba tardia cubre 0, 100, 500 y 1500 ms y verifica que no aparece un falso catalogo vacio.
