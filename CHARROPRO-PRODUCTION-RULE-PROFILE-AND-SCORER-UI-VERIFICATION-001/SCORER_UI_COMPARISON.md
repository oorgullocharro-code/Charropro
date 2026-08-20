# Scorer UI Comparison

## Metodo

Se resolvio cada suerte dos veces con los modulos versionados actuales:

1. Product Base sin perfil.
2. Product Base mas `FMCH_2026_LIBRE` 0.6.0.

No se modificaron valores. La tabla muestra numero de botones activos como
`PRODUCT_BASE -> FMCH` para: oportunidades, base, adicionales, infracciones,
infracciones al equipo y descalificaciones.

| Suerte | Oport. | Base | Adic. | Infr. | Equipo | Desc. | Diferencia visible principal |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Cala | 1->1 | 1->1 | 7->7 | 18->43 | 2->2 | 17->36 | Textos FMCH completos, mas infracciones y DQ; conserva calculador de punta |
| Piales | 3->3 | 3->8 | 6->4 | 5->13 | 0->1 | 3->17 | Ocho remates oficiales y calculador numerico de distancia |
| Colas | 3->3 | 4->9 | 4->5 | 7->23 | 0->2 | 4->15 | Nueve tipos de derribo y distancia oficial; cuarta fila sigue bloqueada |
| Toro | 1->1 | 2->5 | 8->13 | 5->14 | 0->1 | 3->16 | Clasificacion Excelente/Buena/Regular/Media Regular/Minima |
| Terna Cabecero | 3->5 | 1->4 | 6->20 | 3->19 | 0->0 | 2->15 | Pool compartido de cinco oportunidades y timer unico de siete minutos |
| Terna Pial | 3->5 | 1->15 | 6->23 | 3->17 | 0->3 | 2->21 | Pool compartido con Cabecero y catalogo de remates/piales FMCH |
| Yegua | 1->1 | 2->5 | 8->13 | 3->12 | 0->3 | 2->17 | Clasificacion dinamica y timer de apretalamiento |
| Manganas Pie | 3->3 | 4->2 | 7->9 | 3->24 | 0->4 | 1->12 | Sencilla/floreada con pasada y captura rapida de floreo |
| Manganas Caballo | 3->3 | 4->20 | 7->2 | 3->23 | 0->3 | 1->15 | Veinte remates; Contra mascara conserva bloqueo de fuente |
| Paso | 1->1 | 2->3 | 5->9 | 2->16 | 0->1 | 2->29 | Tres bases, clasificacion y timers independientes de 3 min y 1 min |

## Ejemplos del catalogo FMCH por suerte

| Suerte | Base | Adicionales | Infracciones | Equipo | Descalificaciones |
| --- | --- | --- | --- | --- | --- |
| Cala | Cala completa | Lados, medios lados, cambio de rectangulo | Revision de freno, linea recta, punta, ceja | Revisor de punta | Arreo, secuencia, caidas, cambio de freno/caballo |
| Piales | Verijas, remolineados, piquetes, rompe chaqueta, floreados | Distancia, rectangulo, relleno, vueltas | Lineas, guia, cabrestear, tiempo | Persona extra | Rotura, reata, lineas, caida, tercer remate |
| Colas | Redondas, medias, sobre lomo, panzazo, senton, molinete | Distancias, Lola, sin apretador | Arcionar, atuendo, caballo, zona | Apretador y apachurrador | Salida, continuidad, caidas, sustancias, guantes |
| Toro | Excelente a Minima | Lola, una mano, tentemozo, verijero, ahorro | Atuendo, sangrado, apretalamiento | Salida del cuadro | Ayuda, caida, reparos, equipo prohibido |
| Cabecero | Sencillo, toro echado, de efecto, floreado | Arracadas, espejos, resortes y floreos | Destroncar, reata, media cabeza | Sin botones declarados | Caida, continuidad, toro no limpio, lazo defectuoso |
| Pial Ruedo | Sencillos y quince remates oficiales | Floreos, resortes y remates | Cobijo, vueltas, ayuda, patas | Limpieza, devolucion, ayuda | Caida, continuidad, rotura, reata, pial invalido |
| Yegua | Excelente a Minima | Lola, grena, cara atras, tentemozo | Atuendo, sangrado, apretalamiento | Devolucion, circunferencia, choque | Ayuda, caida, pegamento, reparos |
| Mang. Pie | Sencilla y floreada con pasada | Desden, encontrada, chorrear, ahorcado | Floreo, lineas, tirones, tiempo | Arreadores y devolucion | Sin pasada, linea, rotura, continuidad |
| Mang. Caballo | Mascara, loro, gavilan, rodadas, contras, Centenario | Encontrada y minuto no usado | Vueltas, lineas, tirones, tiempo | Arreadores y devolucion | Linea, rotura, continuidad, caida |
| Paso | Primera vuelta, segunda vuelta, yegua parada | Arreo, cuartear, distancia, levantarse | Posicion, espuelas, puerta, cuarta | Devolucion | Continuidad, ayuda, vueltas, caidas, equipo prohibido |

## Botones especiales y grupos

- Cala declara `cala_punta` como `specialized_calculator`.
- Piales declara `piales_distancia` como `specialized_calculator`.
- Toro y Yegua declaran opciones de clasificacion dinamica.
- Terna declara cinco oportunidades compartidas y timer compartido de 420000 ms.
- Manganas declara tres oportunidades, captura rapida de floreo y timer de 420000 ms.
- Paso declara clasificacion y timers de 180000 ms y 60000 ms.
- Las reglas no contienen un campo declarativo `visualGroup`; los grupos visuales
  son derivados por los componentes especializados y metadata existentes.

## Estado deportivo del perfil

- Cala: `COMPLETE_WITH_BLOCKED_FIELDS`, FieldID bloqueado.
- Piales: `COMPLETE`, certificacion `PASS`, controles de exportacion bloqueados.
- Colas: certificacion `BLOCKED`, cuarta fila pendiente.
- Toro, Cabecero, Pial Ruedo, Yegua, Manganas Pie y Paso: certificacion `PASS`.
- Manganas Caballo: `PASS_WITH_SOURCE_BLOCKER` por Contra mascara.

La comparacion demuestra que la diferencia percibida es la seleccion de
catalogo, no la ausencia de componentes del scorer.

## Compatibilidad de UI por suerte

| Suerte | Capa FMCH probada | Componente/UI disponible | Readiness UI |
| --- | --- | --- | --- |
| Cala | RULE_PROFILE | Punta especializada, grupos base/adic/infr/team/DQ | YES |
| Piales | RULE_PROFILE | Remate, distancia numerica, tres intentos, historico | YES |
| Colas | RULE_PROFILE | 3 x 3, caida/distancia, equipo e historico | YES |
| Toro | RULE_PROFILE | Clasificacion dinamica, adicionales y apretalamiento | YES |
| Terna Cabecero | RULE_PROFILE | Fase, pool 5, timer compartido, Attempt V2 | YES |
| Terna Pial | RULE_PROFILE | Cambio de fase, early complete, CLOSED_UNUSED | YES |
| Yegua | RULE_PROFILE | Clasificacion dinamica y apretalamiento | YES |
| Manganas Pie | RULE_PROFILE | Resultado, floreo, tirones, remates e historico | YES |
| Manganas Caballo | RULE_PROFILE | Resultado, floreo, tirones, remates e historico | YES |
| Paso | RULE_PROFILE | Clasificacion, resultado y dos timers compactos | YES |

## Contratos UI preservados

- cabecera compacta y workspace operativo;
- footer tactil y CTA visible;
- captura manual horizontal con reflow;
- acordeones de infracciones, equipo, DQ y evidencia;
- colores semanticos;
- Manganas horizontal con reflow movil;
- Paso superior compacto;
- Terna FAIL/SUCCESS, finalizacion inmediata 2/5 y `CLOSED_UNUSED`;
- Attempt V2 con source `RULE_PROFILE` y fingerprint efectivo;
- responsive sin overflow horizontal en 1600x900, 1366x768, 1280x720,
  1024x768 y 390x844.

Las suites dirigidas de las diez suertes, responsive, Full Scorer, Attempt V2 y
Terna aprobaron. El cliente desplegado usa el mismo codigo/cache-buster que el
checkpoint local. No se requiere cambio de UI para consumir un perfil activo.

SCORER UI READY FOR FMCH PROFILE: `YES`.

Esta afirmacion es tecnica y visual; no certifica los tres campos deportivos ni
la politica temporal pendientes.
