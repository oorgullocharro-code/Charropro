# Resultados de pruebas funcionales locales

## Motor sintetico ejecutado

Se uso un torneo, jornada, equipo y roster sinteticos en memoria. No se escribio Firebase
ni se usaron datos deportivos reales. La misma instancia importada de state/scoring y
officialFormat produjo:

| Suerte | Coleccion ejercitada | Total de prueba |
| --- | --- | ---: |
| Cala | 1 intento | 29 |
| Piales | 3 intentos | 62 |
| Coleadero | 3 coleadores x 3 pasadas | 82 |
| Jineteo de Toro | 1 intento | 14 |
| Lazo | 3 intentos | 63 |
| Pial en el ruedo | 3 intentos | 57 |
| Jineteo de Yegua | 1 intento | 14 |
| Manganas a Pie | 3 intentos | 30 |
| Manganas a Caballo | 3 intentos | 30 |
| Paso de la Muerte | 1 intento | 20 |
| Total del equipo | todas las colecciones | 401 |

Tambien se verifico que buildOfficialPackage() genero una hoja, 64 filas normales y 70
filas visuales, con secciones para Cala, Piales en el lienzo, Coleadero, Toro, Terna,
Yegua, Manganas a Pie, Manganas a Caballo y Paso. recordPublishedScore() genero dos revisiones
del mismo intento y marco la primera como superseded.

## Limite de prueba

No se ejecuto publishFirebaseOfficialScoreAtomic() contra Emulator ni se confirmaron
controles mediante navegador autenticado. El motivo y evidencia estan en
SCORER_ENTRYPOINTS.md y SCREENSHOT_INDEX.md. Por ello estas pruebas no sustituyen la
validacion funcional completa exigida para aprobar el ticket.

## Regresion tecnica

- `node --check` paso para los 75 archivos JavaScript bajo `js/`.
- Las 52 suites `tests/*.test.mjs` pasaron, incluidas `cala-rules`,
  `team-penalties-zero`, `official-score-concurrency`, Portal y Broadcast.
