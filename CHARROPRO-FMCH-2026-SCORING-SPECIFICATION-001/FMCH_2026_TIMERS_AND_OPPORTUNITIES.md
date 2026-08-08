# Timers y oportunidades FMCH 2026

## 1. Matriz de cronometros

| Suerte | Timer | Duracion | Alcance | Inicio | Fin/pausa | Adicional | Infraccion | DQ | Tipo |
| --- | --- | ---: | --- | --- | --- | --- | --- | --- | --- |
| Cala | Revision freno/arreo | 2 min | Faena | Inicio de revision | Montado/listo | No | >1 min `-1`; >2 otro `-1` | No por este timer | Individual |
| Cala | Arranque partidero | 2 min max | Faena | Caballo puesto en mano | Arranca carrera | No | >1 min `-1` | >2 min | Individual |
| Piales | Inicio oportunidad | 2 min normal / 3 min condicionado | Cada tiro | Orden del juez | Pialador pide yegua | No | `-2` por minuto excedente | DQ solo por causas catalogadas, no automatica por primer exceso | Individual |
| Colas | Apertura partidero | 20 s | Cada oportunidad | Toro listo y orden del juez | Puerta abre; pausa solo si toro se atora | No | Oportunidad se juega aunque no este listo | Las causas de DQ siguen catalogo | Individual |
| Toro | Apretalamiento | 5 min | Faena | Ruedo limpio, toro encajonado, orden | Puerta a 90 grados | `+1` por minuto ahorrado de primeros 3 si cuenta y no Minima | >3 min `-1`; >4 otro `-1` | >5 min pierde jineteada | Individual |
| Terna | Faena compartida | 7 min | Lazo + Pial | Puerta a 90 grados; floreo previo puede contar desde apretalamiento | Toro rendido y limpio, 5 oportunidades o tiempo; pausa por salida/accidente reglado | `+2`/min, uno a cada lazo, ambos de cuenta | Catalogo | Fin invalida oportunidades restantes segun regla | Compartido |
| Yegua | Apretalamiento | 5 min | Faena | Ruedo limpio, yegua encajonada, orden | Puerta a 90 grados | `+1` por minuto ahorrado de primeros 3 si cuenta y no Minima | >3 min `-1`; >4 otro `-1` | >5 min pierde jineteada | Individual |
| Yegua | Desmontar | 1 min sin infraccion | Faena | Orden de jueces al rendirse reparos | Jinete desmonta | No | `-1` por minuto excedente | DQ por apearse antes/no quedar de pie segun catalogo | Individual |
| Manganas Pie | Faena | 7 min | Tres oportunidades | Orden de jueces | Tercera oportunidad o tiempo; pausa solo por accidente/comision/salida | `+1` por minuto completo no usado si una consumada | Mangana puesta en minuto 7 y luego derriba `-3` | >7 min descalifica no intentadas | Individual |
| Manganas | Cambio Pie -> Caballo | 2 min | Transicion | Fin de Pie | Inicio de Caballo o antes si listo | No | Mover yegua `-6 TEAM` | No | Compartido de programa |
| Manganas Caballo | Faena | 7 min | Tres oportunidades | Fin de cambio/orden | Tercera oportunidad o tiempo | `+1` por minuto completo no usado si una consumada | Minuto 7 `-3` | >7 min | Individual |
| Paso | Salida de cajon | 3 min | Faena | Orden con ruedo limpio | Yegua sale completamente | No | No hay escala previa | >3 min | Individual |
| Paso | Desmontar | 1 min sin infraccion | Faena | Orden de jueces al terminar reparos | Pasador desmonta | No | `-1` por minuto excedente | DQ por otras causas de apeada | Individual |

## 2. Contrato de timer

Cada timer futuro requiere, como minimo:

- `timerId`, suerte, alcance y oportunidad;
- `startedAt` de fuente monotona/autorizada;
- `pausedAt`, `resumedAt`, `endedAt` y motivo;
- tiempo oficial consumido/restante;
- revision e idempotency key;
- actor que inicia/pausa/reanuda/termina;
- evidencia de tiempo preservada;
- estado `idle/running/paused/expired/completed`;
- regla de adicional, infraccion o DQ aplicada una sola vez.

El timer no debe usar el reloj del navegador como autoridad unica. Refresh, reconexion o retry no reinician una cuenta oficial ni duplican una penalizacion.

## 3. Matriz de oportunidades

| Suerte | Participantes | Oportunidades | Shared | Secuencia | Dependencia | Historial requerido |
| --- | ---: | ---: | --- | --- | --- | --- |
| Cala | 1 | 1 faena | No | Presentacion -> punta -> lados -> medios -> ceja | Freno/caballo y orden completo | Secuencia y medidas de punta |
| Piales | 1 | 3 | No | 1-2-3 | Al menos un remate diferente; excepcion art. 97 | Remate y consumacion por tiro |
| Colas | 3 | 3 cada uno | Roster/orden | Mismo orden en rondas | Suplente solo por fuerza mayor; un intento de arcionar | Coleador, ronda, sustitucion y reposicion |
| Toro | 1 | 1 faena | No | Timer -> salida -> reparos -> apeada | Clasificacion y acciones | Selecciones dinamicas |
| Terna | 3 | 5 totales | Si | Solo un lazador activo | Un cabeza y un pial cuentan; toro limpio | Cupo compartido, lazador, tipo, resultado |
| Lazo Cabeza | Hasta 3 terneadores | Dentro de 5 | Si | Segun lazador activo | Solo un lazo de cabeza de cuenta | Oportunidad compartida y movimientos |
| Pial Ruedo | Hasta 3 terneadores | Dentro de 5 | Si | Segun lazador activo | Remates distintos por mismo lazador | `remateHistoryByLazador` |
| Yegua | 1 | 1 faena | No | Timer -> salida -> reparos -> apeada | Clasificacion y acciones | Selecciones dinamicas |
| Manganas Pie | 1 + 3 arreadores | 3 | No | 1-2-3 | Tres remates distintos | Remate, tirones, reposicion |
| Manganas Caballo | 1 + 3 arreadores | 3 | No | 1-2-3 | Tres remates distintos | Remate, tirones, reposicion |
| Paso | 1 + 2 arreadores | Max. 2 vueltas | No | Primera y, si procede, segunda | Continuidad; izquierda a derecha; sentido mascara | Vuelta, cuarto, reposicion |

## 4. Ciclo de oportunidad

Estados conceptuales:

```text
AVAILABLE -> ACTIVE -> ATTEMPTED -> CONSUMED
                    -> NOT_ACHIEVED
                    -> DISQUALIFIED
                    -> REPLACED
                    -> LOST
```

- `REPLACED` crea una nueva ejecucion enlazada y no borra infracciones preservables.
- `LOST` consume cupo sin valor cuando la regla asi lo indica.
- `DISQUALIFIED` conserva malos y causa.
- `NOT_ACHIEVED` no se transforma en `AVAILABLE` por refresh.
- Una misma revision es idempotente.

## 5. Dependencias especiales

### Piales

La distancia no diferencia remate. Si los dos primeros remates iguales solo produjeron una oportunidad consumada, la tercera puede repetir; en otro caso el tercer remate repetido es DQ.

### Terna

El contador pertenece al equipo, no a cada pantalla. Lazo y Pial no tienen tres intentos independientes. Al iniciar un segundo lazador antes de terminar/limpiar la oportunidad previa, la oportunidad vigente se pierde y se registra la consecuencia reglamentaria.

### Manganas

Pie y Caballo comparten reglas, pero no score, timer ni historial de remates. Cada suerte exige tres remates diferentes. Segundo tiron lleva el acumulado a `-2`; tercero a `-4`; derribo despues de tercero es DQ.

### Paso

La segunda vuelta no es un intento independiente libre: pertenece a la misma faena y depende de conservar continuidad. Una reposicion vuelve a la vuelta vigente y puede eliminar el derecho a distancia si ocurrio en primera.

## 6. Casos de prueba de tiempo y oportunidad

1. Pial normal inicia a 2:01: `-2` una sola vez; retry no duplica.
2. Pial posterior a pial de cuenta usa ventana de 3 min.
3. Terna con cuatro cabeza + un pial bloquea sexta oportunidad.
4. Terna con solo un lazo de cuenta no recibe tiempo.
5. Manganas con una consumada y tres minutos completos no usados recibe `+3`.
6. Mangana entra en minuto 7 y derriba: score valido con `-3`.
7. Tercer tiron: malos acumulados `-4`, no `-6`.
8. Toro/Yegua Minima no recibe tiempo ahorrado.
9. Paso a 3:00 exactos permanece valido; exceder aplica DQ segun evento oficial.
10. Publicacion fallida conserva timer y oportunidad activa; no avanza.
