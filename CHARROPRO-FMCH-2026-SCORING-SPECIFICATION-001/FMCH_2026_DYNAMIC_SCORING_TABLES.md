# Tablas dinamicas de puntuacion FMCH 2026

## 1. Contrato comun

Las clasificaciones son decisiones del juez. El sistema no las infiere por score, timer o movimiento. La evaluacion conceptual es:

```text
classification -> selectedFeatures -> rowValues -> goodPoints/badPoints
```

Al cambiar clasificacion:

1. Se conserva `attemptId`, participante, caballo, evidencia, nota y auditoria.
2. Se conservan selecciones compatibles por identidad de regla.
3. Se reemplaza el valor de cada seleccion por el de la nueva fila.
4. Un valor cero sigue siendo una seleccion valida y no ausencia.
5. Las columnas que dejan de ser aplicables se desactivan con diagnostico; no se borran silenciosamente.
6. No cambian template, geometria, permisos ni identidad deportiva.
7. La publicacion persiste clasificacion, selecciones y valores resueltos, no solo el total.

El calculo no puede reutilizar IDs entre adicionales e infracciones. En particular, `ttm` debe separarse conceptualmente en `toro_adic_tentemozo` y `toro_infr_tiempo_excedido` durante la implementacion futura.

## 2. Jineteo de Toro

Referencia: Reglamento 2026, art. 147 y tabla de pagina 60.

| Clasificacion | Base | Piochi/cola | Lola | Una mano | Cara atras | Tentemozo | Gaza 2 manos | Piernas | Quitar verijero | Quitar gaza/tentemozo | Bajar sin lazo | Levanta sin ayuda | Levanta con ayuda | Descomponerse |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Excelente | 20 | 3 | 3 | 3 | 3 | 4 | 4 | 3 | 2 | 2 | 1 | 3 | 2 | -1 |
| Buena | 16 | 2 | 2 | 2 | 2 | 4 | 4 | 2 | 2 | 2 | 1 | 2 | 1 | -2 |
| Regular | 12 | 1 | 1 | 1 | 1 | 3 | 3 | 1 | 1 | 1 | 1 | 1 | 0 | -3 |
| Media Regular | 8 | 0 | 0 | 0 | 1 | 1 | 1 | 0 | 0 | 1 | 0 | 1 | 0 | -4 |
| Minima | 6 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | -5 |

Reglas:

- Las acciones individuales acumulan.
- `Descomponerse` se registra en malos, no como adicional negativo mezclado.
- Tiempo ahorrado: `+1` por minuto de los tres iniciales, solo si la monta se consuma y no es Minima.
- Pretal de gaza a dos manos exige ambas manos entre pretal y lomo durante reparos.
- `Bajar sin lazo` no aplica con toro echado.
- Toro caminando, corriendo, trotando o brincando: Minima.
- El comportamiento dinamico es requisito nuevo; no debe describirse como ya implementado.

Ejemplos:

| Entrada | Resultado |
| --- | --- |
| Excelente + Tentemozo + Una mano | `20 + 4 + 3 = 27` |
| La misma seleccion cambia a Regular | `12 + 3 + 1 = 16` |
| Media Regular + Cara atras + Quitar gaza | `8 + 1 + 1 = 10` |
| Minima + 2 minutos ahorrados | `6`; tiempo no adiciona |
| Buena + Descomponerse | `16 - 2 = 14` |

## 3. Jineteo de Yegua

Referencia: Reglamento 2026, arts. 173-185 y tabla de pagina 78.

| Clasificacion | Base | Lola | Una mano | A la grena | Cara atras | Tentemozo | Gaza 2 manos | Piernas | Quitar verijero | Quitar gaza/tentemozo | Oreja/cruzar pierna | Levanta sin ayuda | Levanta con ayuda | Descomponerse |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Excelente | 20 | 3 | 3 | 3 | 3 | 4 | 4 | 3 | 2 | 2 | 1 | 3 | 2 | -1 |
| Buena | 16 | 2 | 2 | 2 | 2 | 4 | 4 | 2 | 2 | 2 | 1 | 2 | 1 | -2 |
| Regular | 12 | 1 | 1 | 1 | 1 | 3 | 3 | 1 | 1 | 1 | 1 | 1 | 0 | -3 |
| Media Regular | 8 | 0 | 0 | 0 | 1 | 1 | 1 | 0 | 0 | 1 | 0 | 1 | 0 | -4 |
| Minima | 6 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | -5 |

Confirmaciones de fuente que cierran bloqueos anteriores:

- `Jugar las piernas`: `3/2/1/0/0`.
- `Oreja o cruzar pierna`: `1/1/1/0/0`.
- `Descomponerse`: `-1/-2/-3/-4/-5`.

Reglas:

- `No repara` o sale caminando/trotando/corriendo/brincando = Minima 6, sin adicionales, no DQ.
- Tiempo ahorrado: `+1` por minuto de los tres iniciales si se consuma y no es Minima.
- Para jugar piernas deben salir por delante y operar simultaneamente durante reparos.
- Quitar verijero/pretal exige yegua parada, no echada, con condiciones de tabla.
- Levantarse despues de caida de la yegua se valora por fila; una caida posterior del jinete aplica la consecuencia reglada.

Ejemplos:

| Entrada | Resultado |
| --- | --- |
| No repara, cualquier seleccion previa | `6`, selecciones sin puntos |
| Excelente + Lola + Tentemozo | `20 + 3 + 4 = 27` |
| Misma seleccion cambia a Media Regular | `8 + 0 + 1 = 9` |
| Regular + Oreja + Descomponerse | `12 + 1 - 3 = 10` |

## 4. Paso de la Muerte

Referencia: Reglamento 2026, arts. 218-239, tabla pagina 96.

### 4.1 Base de vuelta

| Base | Puntos | Distancia |
| --- | ---: | --- |
| Primera vuelta | 20 | Primer/segundo/tercer cuarto `+3/+2/+1` |
| Segunda vuelta | 15 | Sin adicional de distancia |
| Yegua parada, caminando o trotando | 5 | Sin adicional de distancia |

### 4.2 Matriz de reparos

| Clasificacion | Sin arreo | Con arreo | Cuartear sin arreo | Cuartear con arreo | Apearse oreja/pierna | Levantarse sin ayuda | Descomponerse |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Excelente | 6 | 2 | 3 | 2 | 1 | 2 | 0 |
| Buena | 4 | 2 | 2 | 1 | 1 | 1 | -1 |
| Regular | 2 | 0 | 1 | 0 | 0 | 0 | -2 |
| Minima | 1 | 0 | 0 | 0 | 0 | 0 | -3 |

Reglas:

- `Sin arreo` requiere que los dos arreadores detengan sus cabalgaduras al caer el pasador en el lomo y hasta el desmonte.
- `Cuartear` requiere al menos dos cuartazos con energia al caerle a la yegua.
- Reparos minimos exigen al menos un reparo; correr o brincar no basta.
- `Descomponerse` va a malos.
- La distancia se decide por los cuartos delanteros de la yegua y donde cae el jinete.
- Cambiar clasificacion recalcula reparos, pero no cambia vuelta, cuarto ni arreo.

Valores antes ilegibles confirmados en pagina 97:

- no soltarse de la rienda o caballo manso dentro de dos trancos: `-4`;
- no intentar la faena: `-10`.

Ejemplos:

| Entrada | Resultado |
| --- | --- |
| Primera, primer cuarto, Excelente sin arreo | `20 + 3 + 6 = 29` |
| Segunda, Buena con arreo | `15 + 2 = 17` |
| Primera, Regular, cuarteo sin arreo, segundo cuarto | `20 + 2 + 1 = 23` |
| Parada/caminando/trotando | `5`, sin distancia |

## 5. Atomicidad e historial

Una actualizacion dinamica invalida no modifica el intento. La operacion valida incrementa revision una vez, conserva `createdAt`, actualiza `updatedAt` y registra actor. El historial debe poder reconstruir:

- clasificacion anterior y nueva;
- selecciones preservadas, desactivadas o agregadas;
- valores anteriores y nuevos;
- motivo manual si existe;
- total bueno, malo y de equipo;
- evidencia y nota sin cambios.

## 6. Impacto de implementacion

| Dominio | Estado actual | Cambio futuro |
| --- | --- | --- |
| Toro | Bases 14/18 y valores fijos | Reemplazo controlado por matriz 5 x 13; resolver `ttm` |
| Yegua | Bases 14/18 y valores fijos | Reemplazo controlado por matriz 5 x 13 |
| Paso | Bases 20/15 y adicionales fijos parciales | Agregar base 5, distancia exclusiva y matriz 4 x 7 |

Ninguna tabla modifica el Reglamento, recalcula scores historicos ni autoriza migracion automatica en este ticket.
