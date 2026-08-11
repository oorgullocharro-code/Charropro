# Full Scorer Integration Evidence

## Fixture

- Proyecto: `demo-charropro-local`.
- Torneo: `demo-local-fmch-2026`.
- Charreada: `demo-local-fmch-jornada-1`.
- Tres equipos y datos totalmente sinteticos.
- Auth, RTDB, Functions y Storage Emulator en `9099`, `9000`, `5001` y `9199`.

## Recorrido 10/10

| Orden | Suerte | Resultado |
| --- | --- | --- |
| 1 | Cala de Caballo | PASS |
| 2 | Piales en el Lienzo | PASS |
| 3 | Coleadero | PASS |
| 4 | Jineteo de Toro | PASS |
| 5 | Lazo a la Cabeza | PASS |
| 6 | Pial en el Ruedo | PASS |
| 7 | Jineteo de Yegua | PASS |
| 8 | Manganas a Pie | PASS |
| 9 | Manganas a Caballo | PASS |
| 10 | Paso de la Muerte | PASS |

La prueba automatica recorrio la secuencia completa de oportunidades y los tres equipos. Cubrio pendientes en Cala, Terna, Manganas y Paso, conservando oportunidades compartidas, timer metadata, evidencia, floreo y remate.

## Validacion operativa real

1. Juez sintetico capturo Cala de 20 puntos.
2. La dejo pendiente por revision de video.
3. El scorer avanzo de Equipo A a Equipo B sin score oficial prematuro.
4. Una recarga mantuvo contador `Pendientes 1`.
5. En Manganas a Pie, Equipo B, oportunidad 2/3, se preparo un borrador de 12 puntos: base 10 y floreo 2.
6. Se abrio la Cala pendiente y su draft de 20 puntos fue restaurado.
7. `Resolver y publicar` uso la publicacion oficial; el fanout quedo confirmado por lectura cliente.
8. El registro pendiente paso a `resolved` y el contador regreso a cero.
9. El scorer regreso exactamente a Manganas a Pie, Equipo B, oportunidad 2/3, conservando los 12 puntos.
10. Una segunda pendiente de Manganas se abrio y se cancelo; regreso a oportunidad 3/3 sin publicar y mantuvo `Pendientes 1`.
11. Dos pestanas autenticadas recibieron el mismo contador remoto; solo la pestana que abrio una pendiente de Piales entro en modo de resolucion.
12. Al recargar esa pestana se recuperaron la sesion y el draft de 14 puntos; la hidratacion remota de scores no lo reemplazo.
13. La publicacion oficial regreso ambos contadores a `Pendientes 0` y mostro confirmacion cliente.

## Responsive

| Viewport | Panel/lista/footer | Scroll horizontal |
| --- | --- | --- |
| Desktop 1440 x 900 | PASS | NO |
| iPad landscape 1180 x 820 | PASS | NO |
| iPad portrait 820 x 1180 | PASS | NO |
| Mobile 390 x 844 | PASS | NO |

El footer conserva el orden Deshacer, Marcar 0, Pendiente, Guardar y siguiente. La lista y las acciones son touch-friendly y no abren una pantalla nueva.

## Preservacion transversal

Las pruebas confirman cero, DQ, adicionales e infracciones manuales, evidencia, nota, timer metadata, oportunidades, clasificaciones, floreo y remates. Scores historicos no se recalcularon.
