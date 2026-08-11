# Evidencia de validacion

## Baseline before

Medicion con cliente real y datos sinteticos antes de editar:

| Suerte | Fin de cabecera | Primer control | Total |
| --- | ---: | ---: | ---: |
| Cala | 214 px | 1013 px | 3091 px |
| Toro | 214 px | 962 px | 2408 px |
| Manganas a Pie | 214 px | 606 px | 2956 px |
| Paso | 262 px | 655 px | 2837 px |

La barra de oportunidad terminaba entre 349 y 397 px. El total quedaba varias pantallas debajo.

## Resultado after en iPad landscape

Viewport CSS real: 1193 x 833.

| Suerte | Total arriba | Primer control | Footer | Control visible |
| --- | ---: | ---: | ---: | --- |
| Cala | 325 px | 503 px | 763 px | Si |
| Terna / Lazo | 257 px | 332 px | 763 px | Si |
| Manganas a Pie | 249 px | 436 px | 763 px | Si |
| Paso | 249 px | 372 px | 763 px | Si |

En las diez suertes medidas, el primer control quedo entre 317 y 420 px en viewport amplio. No hubo scroll horizontal.

## Responsive

| Escenario | Viewport CSS | Resultado |
| --- | --- | --- |
| iPad landscape | 1193 x 833 | PASS, control principal antes del footer |
| iPad portrait | 833 x 1193 | PASS, ancho 833 / scrollWidth 833 |
| Desktop | 1920 x 1080 | PASS, area util limitada a 1600 px |
| Mobile | 390 x 843 | PASS, ancho 390 / scrollWidth 390 |

Los controles deportivos y acciones del footer no registraron targets menores a 44 px tras la correccion.

## Casos complejos

- Terna: Cabecero y Pial disponibles, oportunidad compartida `0/5`, timer comun, infracciones y footer accesibles.
- Manganas: floreo rapido `0 -> 1 -> 0`; detalle abre y cierra inline sin perder el total; timer `07:00.0` e infracciones accesibles.
- Paso: clasificacion visible, timers oficiales `03:00.0` y `01:00.0`, resultado, infracciones y footer accesibles.
- Cala: Punta, base, adicionales, infracciones, DQ, cero y total preservados.

## Operacion de juez

Entorno: Firebase Emulator Suite, proyecto `demo-charropro-local`, usuario sintetico Juez.

- Seleccionar regla: PASS.
- Agregar adicional: PASS.
- Agregar infraccion: PASS.
- Total inmediato `21 pts`: PASS.
- Deshacer: PASS.
- Marcar cero: PASS.
- Guardar y siguiente: PASS.
- Persistencia en RTDB local: PASS.
- Publicacion oficial local: PASS.
- Escrituras a produccion: 0.

## Automatizacion

- Suite completa: 64/64 PASS.
- Suite nueva: `tests/scorer-information-hierarchy-compaction.test.mjs` PASS.
- Regresiones dirigidas: Cala, Piales, Coleadero, Toro, Yegua, Terna, Manganas, Paso, Attempt V2, Rule Profile, concurrencia oficial y zero/team penalties PASS.

Capturas temporales revisadas durante la validacion:

- `scorer-compaction-before-cala.jpg`
- `scorer-compaction-before-paso.jpg`
- `scorer-compaction-after-cala-ipad-landscape.jpg`
- `scorer-compaction-after-terna-ipad-landscape.jpg`
- `scorer-compaction-after-manganas-ipad-landscape.jpg`
- `scorer-compaction-after-paso-ipad-landscape.jpg`
- `scorer-compaction-after-manganas-ipad-portrait.jpg`
- `scorer-compaction-after-cala-desktop-final.jpg`

Las capturas usan exclusivamente datos sinteticos y no forman parte del producto.
