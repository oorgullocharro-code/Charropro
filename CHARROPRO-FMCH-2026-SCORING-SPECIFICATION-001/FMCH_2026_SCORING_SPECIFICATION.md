# Especificacion maestra del calificador FMCH 2026

## 1. Control documental

- Ticket: `CHARROPRO-FMCH-2026-SCORING-SPECIFICATION-001`.
- Tipo: especificacion funcional, reglamentaria y tecnica; no implementacion.
- Base Git: `c1dbee9274efd00e7df1a34623585c0094dfe521`.
- Perfil activo: equipos categoria Libre, salvo cuando se indique expresamente un perfil futuro.
- Reglamento fuente: Reglamento Oficial Charros Libre y Juvenil 2024-2028, adecuaciones 2026, SHA-256 `1343e2205c7b6599a2ab7e93a809a5a45bd5ab1aadaba2f5a25bf43db8b4af2b`.
- Formato fuente: Hoja de Calificacion Equipo Charros 2024-2028, SHA-256 `3a14fe3d6add5add76033765b27227c44f04c8e31330ce4aeb3248828701dca7`.
- Auditorias reutilizadas: especificacion del documento oficial, data mapping, validacion deportiva, auditoria funcional del scorer actual y baseline de preservacion 2026.

La fuente normativa para valores deportivos es el Reglamento. El formato oficial define la topologia documental y los FieldID; no autoriza por si solo una formula. El producto actual sirve para determinar reutilizacion, compatibilidad y brechas, no para sustituir la regla oficial.

## 2. Contratos transversales no negociables

### 2.1 Modelo conceptual de puntos

Por intento u oportunidad:

```text
goodPoints = base + officialAdditionals + manualAdditional
badPoints = individualInfractions + manualInfringement
individualResult = disqualified ? (0 - badPoints) : (goodPoints - badPoints)
teamImpact = individualResult - teamInfractions
```

Las infracciones al equipo permanecen separadas del score individual y se descuentan del total general en la frontera de agregacion correspondiente. Una reposicion conserva las infracciones que el Reglamento declare acumulables.

### 2.2 Descalificacion

Una DQ elimina los puntos buenos de la oportunidad o faena afectada y conserva:

- infracciones individuales acumuladas;
- infracciones al equipo;
- evidencia y `timeEvidence`;
- `attempt.note`;
- actor, timestamps, revision e historial;
- causa reglamentaria de DQ.

La salida conceptual es `0 - badPoints`, no un borrado del intento. Cuando la regla descalifica solo una oportunidad, no elimina las otras oportunidades validas.

### 2.3 Cero, no logrado y estados de oportunidad

No son sinonimos:

| Estado | Intentada | Puntos buenos | Infracciones | Consume oportunidad |
| --- | --- | ---: | --- | --- |
| No intentada | No | 0 | Las que procedan por tiempo/regla | No, salvo cierre reglamentario |
| Intentada no lograda | Si | 0 | Se conservan | Si |
| Cero reglamentario | Si | 0 | Se conservan | Segun regla |
| DQ | Si o por conducta reglada | 0 | Se conservan | Si, salvo reposicion expresa |
| Oportunidad perdida | Si | 0 | Se conservan | Si |
| Reposicion | Se repite | 0 provisional | Se conservan si la regla lo ordena | No consume la nueva oportunidad |
| No cuenta | Si | 0 | Se conservan si proceden | Segun regla |

`Marcar 0` debe seguir usando el contrato actual `attempted/notAchieved` cuando no exista valor deportivo, sin borrar penalizaciones. No debe producir DQ de manera implicita.

### 2.4 Herramientas manuales

Se preservan como excepcion controlada:

- adicional manual: puntos y motivo;
- infraccion manual: puntos y motivo.

No sustituyen el catalogo oficial, no elevan permisos y quedan en auditoria. Las infracciones al equipo usan un canal distinto.

### 2.5 Publicacion y proteccion de scores

El flujo permanece:

```text
DRAFT -> publicacion oficial atomica -> publishedScores
      -> audit/publishedScores -> live/current -> proyeccion publica
```

`Guardar y siguiente` guarda el draft, publica el score oficial y avanza solo despues de exito. La ausencia local no autoriza borrar datos remotos; cada publicacion individual es autoritativa por `scoreId`; el estado compartido no puede reducir el universo remoto.

### 2.6 Footer congelado

El footer vigente contiene estado de conexion, `Ajustar botonera`, `Deshacer`, `Marcar 0` y `Guardar y siguiente`. Evidencia, nota y estado de guardado viven fuera del footer. `Deshacer` hoy navega al score anterior y reinicia el cronometro; no es undo deportivo. No existe boton `Guardar` separado. `Pendiente a revision` no tiene artefacto recuperado y permanece `SOURCE/HISTORICAL_ARTIFACT_REQUIRED`.

### 2.7 UI futura

La implementacion posterior sera iPad-first, portrait y landscape, con scroll vertical, sin scroll horizontal, objetivos tactiles grandes, footer accesible y nombres reales. Este documento fija controles y estados, no el layout final.

## 3. Resumen de completitud

| Suerte | Estado | Bloqueo puntual |
| --- | --- | --- |
| Cala de Caballo | `COMPLETE_WITH_BLOCKED_FIELDS` | Equivalencias de exportacion `ML/CR` frente a `MD/MI/PC` |
| Piales en el Lienzo | `COMPLETE` | Sin valor deportivo bloqueado |
| Coleadero | `COMPLETE_WITH_BLOCKED_FIELDS` | Semantica de cuarta fila del formato |
| Jineteo de Toro | `COMPLETE` | El ID `ttm` debe separarse al implementar, sin duda reglamentaria |
| Lazo de Cabeza | `COMPLETE` | Depende del dominio compartido de Terna |
| Pial en el Ruedo | `COMPLETE` | Depende del dominio compartido de Terna |
| Jineteo de Yegua | `COMPLETE` | Valores antes ambiguos confirmados en tabla oficial |
| Manganas a Pie | `COMPLETE` | Sin valor deportivo bloqueado |
| Manganas a Caballo | `COMPLETE_WITH_BLOCKED_FIELDS` | Doble mencion de `Contra mascara` en art. 217 |
| Paso de la Muerte | `COMPLETE` | Los dos valores antes ilegibles fueron confirmados |

Los detalles exhaustivos de bases, adicionales, infracciones y DQ estan en `FMCH_2026_RULE_MATRIX.md`; las tablas dependientes de clasificacion estan en `FMCH_2026_DYNAMIC_SCORING_TABLES.md`.

## 4. Cala de Caballo

| Contrato | Especificacion |
| --- | --- |
| Nombre / participantes | Cala de Caballo; un calador y una cabalgadura |
| Oportunidades | Una faena secuencial completa |
| Timer | Revision: >1 min `-1`, >2 min otro `-1`; arranque: >1 min `-1`, >2 min DQ |
| Base | Cala completa `20` |
| Dependencia | Presentacion de freno, carrera, punta, lados, medios lados, cambio de rectangulo, ceja, paso natural y saludos |
| Estado | Freno/cabalgadura, secuencia, punta metros/tiempos, lados, medios lados, ceja, penalizaciones de equipo |
| Campos | Participante, caballo, `puntaMetros`, `puntaPiquetes`, adicionales, infracciones, team infractions, DQ, evidencia, nota |
| UI necesaria | Calculador de punta preservado; controles de lados/medios lados/cambio; manuales; DQ; evidencia/nota; footer congelado |
| Reutilizar | `calaRules.js`, calculador de punta, team penalties, draft/publicacion/historial |
| Brecha | El catalogo actual cubre solo 18 de 43 infracciones y 17 de 36 DQ; equivalencia documental de `ML/CR` pendiente |

**Calculo.** `20 + punta + lados + medios lados + cambio de rectangulo + manuales - infracciones`; team penalties se agregan aparte. Punta: 6 m minimo; `+3/+2/+1` por uno/dos/tres tiempos; `+1` por metro completo desde el septimo, redondeando al inmediato superior solo si supera 51 cm. Maximo cuatro tiempos.

**Condicionales.** La punta solo adiciona si cumple seis metros y maximo cuatro tiempos. Los pivotes acumulan con lados de seis o mas vueltas. La secuencia es obligatoria; freno y cabalgadura no cambian salvo fuerza mayor avalada.

**DQ/0/publicacion.** DQ de faena elimina buenos y preserva malos. `Marcar 0` representa cala intentada sin valor, no una cala incompleta valida. La publicacion exige identidad de participante/caballo, secuencia, punta y desglose estable.

**Pruebas minimas.** Cala completa 20; punta 8 m/1 tiempo = `+5`; punta <6 m = `0`; DQ con `-3` conserva total `-3`; penalizacion de revisor permanece en equipo; publicacion fallida no avanza.

## 5. Piales en el Lienzo

| Contrato | Especificacion |
| --- | --- |
| Participantes / oportunidades | Un pialador; tres oportunidades individuales y secuenciales |
| Timer | Dos minutos para iniciar cada oportunidad; tres si la anterior fue pial de cuenta o hubo rotura/nudo llevando pial; `-2` por minuto excedente |
| Bases | Verijas 14; remolineado adelante 18; atras 20; piquete adelante 22; atras 24; rompe chaqueta 26; floreado adelante 28; atras 30 |
| Dependencia | Al menos un remate distinto en tres tiros, con excepcion reglada cuando solo una de las dos primeras iguales fue consumada |
| Estado | Opportunity number, remate, base, distancia real, detencion, relleno, vueltas en mano, consumada, timer, infracciones y DQ |
| UI necesaria | Ocho bases como botones; tres intentos; distancia numerica; adicionales oficiales; historial de remate; manuales; DQ |
| Reutilizar | Intentos, manuales, timer, evidencia/nota, publicacion |
| Brecha | Catalogo actual de tres bases y adicionales `Canilla/Sobra tiempo` no representa la tabla 2026 |

**Calculo.** Cada oportunidad conserva score propio y el total de la suerte suma las tres. Distancia adicional es `+1` por metro excedente; no son bandas `+1/+2/+3`. Lazo de verijas no obtiene adicionales.

**Condicionales.** La faena se consuma al detener por completo antes de 90 m. Un remate repetido puede descalificar solo el tercer tiro bajo art. 97/110. Caballo dentro del rectangulo al detener `+1`; relleno de madera `+2`; todas las vueltas en mano `+1`.

**DQ/0/publicacion.** Cada DQ afecta su oportunidad. Un tiro no rematado a velocidad minima consume oportunidad salvo excepcion de paso caminando/trotando o carrera irregular. Publicar conserva las tres oportunidades y el historial de remates.

**Pruebas minimas.** Ocho bases; distancia 3 m extra = `+3`; verijas ignora adicionales; tercer remate repetido DQ; timeout `-2` por minuto; retry de publicacion no duplica score.

## 6. Coleadero

| Contrato | Especificacion |
| --- | --- |
| Participantes / oportunidades | Tres coleadores en orden fijo; tres oportunidades por coleador; suplente solo por fuerza mayor |
| Timer | Veinte segundos para abrir puerta; toro se juega aunque el coleador no este listo |
| Bases | Nueve caidas: 12, 10, 10, 6, 8, 6, 6, 6 y 6 segun matriz |
| Dependencia | Orden de primera ronda se conserva en las siguientes; un solo intento de arcionar |
| Estado | Coleador, roster/suplente, round 1-3, tipo de caida, distancia, Lola, apretador, acciones obligatorias, reposicion |
| UI necesaria | Matriz vertical 3 x 3; tipo de caida textual con apoyo de diagramas oficiales; distancia; Lola; sin apretador; team infractions |
| Reutilizar | UI especializada 3 x 3, equipos/participantes, intentos, manuales, historial |
| Brecha | El formato tiene cuarta fila no explicada; no se interpreta como cuarto coleador activo sin fuente |

**Calculo.** Cada derribada suma base de caida y una sola banda de distancia: antes de 30 m `+3`, 30-40 `+2`, 40-50 `+1`; Lola `+2`; salir sin apretador `+1`. La caida despues de 60 m es DQ; despues de 70 m lleva la infraccion reglada.

**Condicionales.** Saludar, pachonear y sujetar cola son obligatorios aun sin derribo. Dos o mas intentos de arcionar producen `-2` y la derribada no cuenta. Las infracciones del apretador afectan al equipo. Reposiciones conservan infracciones ya cometidas.

**DQ/0/publicacion.** DQ por oportunidad no borra otras ocho. `Marcar 0` registra oportunidad corrida/no lograda y conserva acciones/penalizaciones. Publicacion conserva orden, coleador real y ronda.

**Pruebas minimas.** Tres coleadores x tres; caida redonda derecha antes de 30 m = 15; dos intentos de arcionar = base 0 y `-2`; reposicion conserva infraccion; sustitucion no permite repetir coleador.

## 7. Jineteo de Toro

| Contrato | Especificacion |
| --- | --- |
| Participantes / oportunidades | Un jinete; una faena |
| Timer | Cinco minutos de apretalamiento: 3 sin infraccion, minuto 4 `-1`, minuto 5 otro `-1`, despues DQ/perdida; `+1` por minuto ahorrado de los tres si cuenta y no es Minima |
| Base | Clasificacion seleccionada por juez: Excelente 20, Buena 16, Regular 12, Media Regular 8, Minima 6 |
| Dependencia | Valores de adicionales y `Descomponerse` dependen de la fila de clasificacion |
| Estado | Clasificacion, selecciones dinamicas, timer, pretal/verijero, salida, reparos, caida/levantada, DQ |
| UI necesaria | Selector textual de clasificacion y controles dinamicos de la fila; nombres reales; sin dibujos |
| Reutilizar | Intento unico, timer, manuales, team penalties, evidencia/nota, publicacion |
| Brecha | Comportamiento dinamico no existe; `ttm` colisiona entre Tentemozo y Tiempo excedido |

**Calculo.** La tabla dinamica suma cada accion seleccionada de la fila. `Descomponerse` es infraccion `-1/-2/-3/-4/-5`. El toro que no repara o sale caminando/corriendo/trotando/brincando recibe Minima; Minima no adiciona por tiempo.

**Condicionales.** Cambiar clasificacion conserva selecciones compatibles y recalcula valores; no altera template, identidad ni historial. Pretal de gaza a dos manos pierde adicional si se saca una mano. Acciones individuales acumulan.

**DQ/0/publicacion.** DQ de faena conserva infracciones. `No repara` no es DQ. Publicacion guarda clasificacion y selecciones, no solo total.

**Pruebas minimas.** Excelente con Tentemozo y una mano = 28; cambiar a Regular recalcula a 18; Minima sin reparo = 6 y tiempo 0; DQ con sangrado `-2`; IDs de Tentemozo/Tiempo independientes.

## 8. Terna: dominio compartido

| Contrato | Especificacion |
| --- | --- |
| Participantes / oportunidades | Tres terneadores; cinco oportunidades compartidas para cabeza o pial |
| Timer | Siete minutos compartidos; inicia al abrir cajon a 90 grados, aunque puede existir floreo en apretalamiento; `+2` por minuto no usado, uno a cada lazo, solo si ambos cuentan |
| Secuencia | Un solo lazador activo; no floreo simultaneo; solo un lazo de cabeza y un pial califican |
| Estado compartido | `sharedOpportunityNumber`, lazador, tipo, remate, resultado, timestamp, tiempo restante, lazo contado, pial contado y limpieza del toro |
| UI futura | Pantallas separadas para Lazo y Pial; mismo estado y timer por debajo; no pantalla horizontal fusionada |
| Reutilizar | Seleccion de suerte, timer, intentos, manuales, equipo, publicacion; extender a estado compartido |
| Brecha | Hoy Lazo y Pial operan como tres intentos independientes; no existe cupo compartido de cinco |

Si el siguiente lazador inicia floreo o intenta antes de concluir/limpiar la oportunidad previa, la oportunidad previa se pierde y la conducta esta tipificada como DQ de la oportunidad conforme a los arts. 149 y listas de DQ. El sistema futuro debe bloquear o exigir confirmacion de juez, pero nunca contar dos lazadores activos.

El pial puede capturarse como intento dentro de las cinco oportunidades; la consumacion de la Terna y el adicional de tiempo requieren lazo de cabeza y pial de cuenta. No se inventa una prohibicion de captura anterior al cabecero: se conserva el estado provisional hasta cumplir la dependencia reglamentaria.

**Pruebas minimas.** Cinco oportunidades entre ambos tipos; sexto intento bloqueado; simultaneidad pierde/DQ oportunidad; tiempo solo si ambos cuentan; cambio de pantalla no reinicia timer; DQ conserva penalizaciones compartidas.

## 9. Lazo de Cabeza

| Contrato | Especificacion |
| --- | --- |
| Base | Sencillo 5; sencillo/floreado con toro echado 5; efecto 8; floreado 10 |
| Adicionales | Floreo `+1/+2/+3/+4/+6`; remate atras `+2`, toro parado `+1`, primera `+1`, solo cuernos `+2`, bozal primera `+1`, sin ayuda `+1` |
| Dependencia | Consume una de cinco oportunidades; solo un lazo de cabeza cuenta; toro limpio entre tiros |
| Estado | Lazador, base, movimientos y sustituciones, remate, toro parado/echado, cuernos/bozal, ayuda, oportunidad compartida |
| UI necesaria | Base textual; calculador compacto de floreo con reglas de sustitucion; remate; shared counter/timer |
| Brecha | Catalogo actual usa base generica 10 y remates como adicionales 12/14/16 |

Los resortes sostenidos sustituyen a sus versiones simples; el sostenido a corvejones sustituye simple y sostenido normal; el giro contrario sustituye el giro en mismo sentido; el sostenido incluyendo cabeza sustituye simple/girado incluyendo cabeza. Los movimientos especificados/no especificados requieren un movimiento previo de cuenta.

**Calculo/DQ/0.** Base + floreo normalizado + remate + tiempo compartido - infracciones. Lazo defectuoso estirado, perdida/rotura de reata y otras DQ anulan buenos de esa oportunidad. Un fallo consume oportunidad. Publicacion conserva movimientos, no solo subtotal.

**Pruebas minimas.** Sencillo 5; floreado + pasada con caballo = 16; sustituciones no duplican puntos; lazo media cabeza `-2`; toro echado limita base a 5; simultaneidad no crea dos activos.

## 10. Pial en el Ruedo

| Contrato | Especificacion |
| --- | --- |
| Bases | Sencillo 5; efecto 8; floreado 10; corvero 10; contracorvero 11; cuadrilero/verijero 11; contra 12; vientos 13/14; contravientos 15/16 |
| Dependencia | Consume una de cinco oportunidades; solo un pial cuenta; mismo lazador debe usar remates distintos |
| Estado | `remateHistoryByLazador`, lado/sentido, base, floreo, remate, patas cobijadas, toro limpio, oportunidad compartida |
| UI necesaria | Bases/remates textuales; calculador de floreo; historial visible; shared counter/timer |
| Brecha | Catalogo actual usa base generica 10 y tres remates 10/12/14 |

La igualdad de remate se determina por el efecto final del floreo, sentido de vueltas y posicion/movimiento final; el floreo por si solo no cambia el remate. Encontrado o de contra se consideran diferentes cuando el Reglamento lo declara. Repetir el mismo remate descalifica la oportunidad.

**Calculo/DQ/0.** Base + floreo + remate + tiempo compartido - infracciones. Pial de viento/cuadrilero/verijero que no queda en el cuadril pero queda cobijado se califica sencillo 5. DQ preserva `-6` por perdida cuando corresponda.

**Pruebas minimas.** Las once bases; primera oportunidad `+1`; repeticion DQ; pial rozando manos pero cobijado `-2`; ambos lazos de cuenta habilitan tiempo; historial por lazador no se comparte con otro lazador.

## 11. Jineteo de Yegua

| Contrato | Especificacion |
| --- | --- |
| Participantes / oportunidades | Un jinete; una faena |
| Timers | Apretalamiento 5 min como Toro; despues de orden, un minuto para desmontar y `-1` por minuto excedente |
| Base | Excelente 20, Buena 16, Regular 12, Media Regular 8, Minima 6 |
| Dependencia | Matriz dinamica por clasificacion |
| Estado | Clasificacion, selecciones, timer apretalamiento/desmonte, reparos, caida/levantada, verijero/pretal, DQ |
| UI necesaria | Selector textual y controles dinamicos; no dibujos; nombres reales |
| Reutilizar | Intento unico, timers, manuales, team penalties, publicacion |
| Brecha | Catalogo actual 14/18 y adicionales fijos; debe sustituirse de forma controlada |

**Regla critica.** Si la yegua no repara o sale caminando/trotando/corriendo/brincando, la base es Minima 6 sin adicionales; no es DQ.

**Calculo.** Mismo contrato dinamico de Toro con columnas propias. `Jugar piernas` queda confirmado `3/2/1/0/0`; `oreja/cruzar pierna` queda `1/1/1/0/0`; `Descomponerse` queda `-1/-2/-3/-4/-5`.

**DQ/0/publicacion.** DQ conserva infracciones. Caida de la yegua y levantada puede adicionar segun fila; caida/desmonte del jinete se decide segun excepciones regladas. Publicacion conserva seleccion dinamica y timers.

**Pruebas minimas.** No repara = 6; Excelente Lola + Tentemozo = 27; cambio a Media Regular recalcula 9; minuto 4/5 acumula `-2`; minuto 6 pierde faena; desmonte tardio `-1` por minuto.

## 12. Manganas: reglas compartidas

| Contrato | Especificacion |
| --- | --- |
| Oportunidades | Tres a Pie y tres a Caballo; scores separados |
| Timer | Siete minutos ininterrumpidos por suerte; `+1` por minuto completo no usado si se consumo al menos una oportunidad |
| Remates | Tres remates diferentes por suerte; historial independiente Pie/Caballo |
| Tirones | Maximo tres; segundo `-2`; tercero agrega otros `-2`, total acumulado `-4`; derribo despues del tercero = DQ |
| Minuto 7 | Si la mangana entra en minuto 7 y luego derriba, es valida con `-3` |
| Reposicion | Conserva infracciones cuando art. 202 lo ordena |
| Estado | Opportunity, remate history, timer, pasos del animal, floreo, mangana, tirones, derribo, reposicion |

El valor de tercer tiron se modela como total acumulado `-4`, no `-2 + -4`. Una revision repetida debe ser idempotente. El cambio de Pie a Caballo concede dos minutos; mover la yegua durante ese cambio sanciona al equipo `-6`.

## 13. Manganas a Pie

| Contrato | Especificacion |
| --- | --- |
| Bases | Sencilla con pasada 10; floreada con pasada 10 |
| Adicionales | Floreo completo `+1/+2/+3`; remate Desden/Contra desden/Encontrada `+1`; estirar `+1/+2/+3/+3/+1`; tiempo |
| Dependencia | Toda mangana debe llevar pasada; tres remates distintos |
| UI necesaria | Dos bases; calculador compacto de floreo; remate; forma de estirar; tirones; timer/historial |
| Reutilizar | Tres intentos, timer, manuales, equipo, publicacion |
| Brecha | Catalogo actual Rodada/Sencilla/Mascara/Desden no corresponde al art. 216 |

Sin pasada es DQ de la oportunidad. Rematar despues de la tercera pasada del animal es DQ. Reposicion por caida ajena conserva infracciones ya cometidas.

**Pruebas minimas.** Sencilla con pasada 10; cuatro pasadas `+2`; tercer tiron total `-4`; minuto 7 `-3`; sin pasada DQ; tres remates repetidos detectados por historia.

## 14. Manganas a Caballo

| Contrato | Especificacion |
| --- | --- |
| Bases | Tabla art. 217: 10, 12, 13, 14 y 16 segun remate |
| Adicionales | Floreo `+1/+2/+3/+4/+5`; Encontrada `+1`; tiempo |
| Dependencia | Tres remates distintos; Centenario 16 ignora floreo adicional |
| UI necesaria | Bases textuales; calculador de floreo; `Centenario` deshabilita/ignora floreo; remate y timer |
| Reutilizar | Tres intentos, timer, manuales, equipo, publicacion |
| Brecha | Art. 217 lista `Contra mascara` en dos renglones de 14; requiere identidad documental antes de IDs definitivos |

**Calculo/DQ/0.** Base + floreo permitido + Encontrada + tiempo - infracciones. En Centenario el floreo adicional es cero aunque haya marcas en el estado; la UI debe impedir o advertir, y la publicacion normaliza sin puntuarlo. DQ por repeticion, rotura, cuarto tiron, linea o caida preserva penalizaciones.

**Pruebas minimas.** Mascara 10; Rodada 12; Contra desden 16; Centenario + floreo = 16; tercero tiron total `-4`; cuarto tiron/derribo DQ; minuto 7 `-3`.

## 15. Paso de la Muerte

| Contrato | Especificacion |
| --- | --- |
| Participantes / oportunidades | Un pasador, dos arreadores; maximo dos vueltas dentro de una faena |
| Timers | Tres minutos para salida completa del cajon: exceder = DQ; un minuto tras orden para desmontar: `-1` por minuto excedente |
| Bases | Primera vuelta 20; segunda 15; yegua parada/caminando/trotando 5 |
| Dependencia | Distancia solo en primera vuelta y no para yegua parada/caminando/trotando; matriz de reparos por clasificacion |
| Estado | Vuelta, cuarto, clasificacion, arreo, cuarteo, apeada, caida/recuperacion, timers, continuidad, reposicion, DQ |
| UI necesaria | Vuelta/base, cuarto, clasificacion dinamica, arreo/cuarteo/apeada/levantada, timers |
| Reutilizar | Intento unico, timer, manuales, team penalties, publicacion |
| Brecha | Catalogo actual no contiene matriz ni timers completos; valores fuente antes bloqueados ya confirmados |

**Calculo.** Base + distancia (`+3/+2/+1`) + matriz de reparos - infracciones. La tabla usa Excelente/Buena/Regular/Minima. `No soltarse de rienda/caballo manso dentro de dos trancos` = `-4`; `no intentar la faena` = `-10`, confirmados en pagina 97.

**Condicionales.** Cuarteo exige dos cuartazos con energia. Sin arreo exige que los arreadores detengan sus cabalgaduras. Reposicion por caida previa mantiene la vuelta, pero en primera pierde distancia. Solo izquierda a derecha y sentido mascara.

**DQ/0/publicacion.** Exceder tres minutos, tercera vuelta, caida/desmonte y demas causas regladas son DQ. `No intentar` es infraccion `-10`, no se transforma automaticamente en DQ adicional. Publicacion guarda vuelta, clasificacion, selecciones y timers.

**Pruebas minimas.** Primera vuelta/primer cuarto/Excelente sin arreo = 29; segunda/Buena con arreo = 17; parada = 5 sin distancia; no soltarse = `-4`; no intentar = `-10`; cajon >3 min DQ.

## 16. Tiebreak 2026

### Equipos y Charro Completo

1. Menos puntos malos en la hoja.
2. Mayor numero de oportunidades consumadas en las diez faenas.
3. Menos puntos malos en Colas.
4. Calificacion oficial anterior.

### Primeros lugares individuales

1. Menos puntos malos en la faena.
2. Menos adicionales acumulados en la faena.
3. Mayor puntuacion del equipo.

El motor corresponde al futuro `CHARROPRO-FMCH-2026-TIEBREAK-ENGINE-001`.

## 17. Aclaraciones e inconformidades

Proceso futuro: solo capitan, en el momento reglado, identificando error, competidor y motivo, con firma, anuncio y resolucion. Solo video oficial; no videos externos ni fotografias. La revision es privada para personas autorizadas. No se implementa en este ticket.

## 18. Casos transversales para automatizacion futura

1. DQ con infracciones previas: buenos 0, malos conservados.
2. Cero manual: `attempted/notAchieved`, sin borrar datos.
3. Adicional manual con motivo y auditoria.
4. Infraccion manual con motivo y auditoria.
5. Team infringement separado del score individual.
6. Evidencia asociada sin efecto en puntos.
7. Nota asociada sin efecto en puntos.
8. Recalculo dinamico sin perdida de selecciones compatibles.
9. Cambio de clasificacion conserva identidad e historial.
10. Remate repetido aplica consecuencia de su suerte.
11. Timer agotado aplica infraccion/DQ exacta.
12. Publicacion fallida no avanza.
13. Publicacion exitosa avanza una sola vez.

## 19. Implementacion posterior

Primero debe existir `CHARROPRO-RULE-PROFILE-ENGINE-001`. Despues se implementaran tickets por dominio/suerte, respetando los bloqueos documentales. Esta especificacion no autoriza cambios en producto, Firebase, scores, UI, exportador ni reglas productivas.

## 20. Cobertura documental verificada

`OK` significa que el tema esta definido aqui o en el documento especializado indicado; no significa que ya este implementado en producto.

| Suerte | Oportunidades | Bases | Adicionales | Infracciones | Team | DQ | Timer | Dependencia | Estado | Calculo | UI | FieldID | Reuse | Gaps/fuente | Tests |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Cala | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK |
| Piales | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK |
| Coleadero | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK |
| Toro | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK |
| Lazo Cabeza | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK |
| Pial Ruedo | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK |
| Yegua | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK |
| Manganas Pie | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK |
| Manganas Caballo | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK |
| Paso | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK |

Cobertura: `10/10` suertes; Terna shared y Manganas shared tienen contratos propios y completos.
