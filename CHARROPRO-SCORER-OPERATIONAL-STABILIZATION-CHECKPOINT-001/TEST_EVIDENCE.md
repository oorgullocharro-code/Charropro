# Test Evidence

## Regresion automatizada

- Suite completa: 74/74 PASS con `node --test tests/*.test.mjs`.
- Sintaxis: 177/177 archivos versionables `.js` y `.mjs` PASS.
- JSON: 21/21 archivos versionables PASS.
- Configuration Management: PASS.
- Checksum/fingerprint: `e7c082df542361c09c7f5aeb982b37d47838718f014c09e24fd81cb7555f93fa`.
- `git diff --check`: PASS.
- `git diff --cached --check`: PASS.

El barrido inicial de sintaxis que uso `find` alcanzo un archivo historico dentro de `functions/node_modules`; esa dependencia ignorada no pertenece al repositorio. La corrida oficial uso `rg --files`, el mismo universo versionable de auditorias anteriores, y aprobo 177/177.

## Scans

- Secretos agregados: 0 hallazgos.
- `debugger` agregado: 0 hallazgos.
- `console.debug` / `console.trace` agregados: 0 hallazgos.
- Logs de producto agregados: 0 hallazgos.
- Existe una unica linea `console.log` en la prueba nueva de OVC002 para informar su resultado; no forma parte del runtime.
- Firebase Rules modificadas: no.
- Cache-buster final presente en 74 archivos runtime/fixtures.
- Identificador runtime anterior presente: 0 archivos runtime/fixtures.

## Validacion LOCAL / EMULATOR

- Proyecto: `demo-charropro-local`.
- Auth, RTDB, Functions y Storage Emulator permanecieron como fuentes locales.
- Se creo la charreada sintetica `Checkpoint perfil local` (`charreada_mssce2d3_gjm2s7`).
- La nueva charreada abrio el scorer real con `FMCH_2026_LIBRE 0.6.0` resuelto desde el padre local.
- Lazo mostro cuatro bases FMCH: Sencillo 5, Sencillo o floreado con toro echado 5, De efecto 8 y Floreado 10.
- No aparecio el catalogo generico Product Base `lb1/la1/li1`.
- Se publico un intento cero sintetico; el cliente confirmo el destino publico local y avanzo de 1/5 a 2/5 conservando Cabecero, como exige el contrato FAIL.
- Firebase Production Writes: 0.

## Validacion visual

| Pantalla | Evidencia | Resultado |
| --- | --- | --- |
| Manganas a Pie | panel, Resultado, Floreo, Tirones, Remates e historial; overflow 0 | PASS |
| Paso de la Muerte | clasificacion, Resultado, contexto y dos timers; overflow 0 | PASS |
| Terna | fase Cabecero, 0/5, timer compartido y Pial bloqueado hasta SUCCESS; overflow 0 | PASS |
| Consola directa | pestaña limpia del scorer sin warnings ni errores | PASS |

El fixture responsive genero mensajes `MutationObserver` sin URL durante navegaciones de iframe. El repositorio no contiene `MutationObserver`; una pestaña directa limpia del producto confirmo cero logs. Se clasifica como instrumentacion del harness, no como error de CharroPro.
