# Matriz de reglas FMCH 2026

## 1. Convenciones

- Signo positivo: puntos buenos.
- Signo negativo: puntos malos; el Reglamento imprime el valor absoluto.
- `TEAM`: se descuenta del total del equipo, separado del intento individual.
- `DQ`: buenos de la oportunidad/faena en cero y malos acumulados preservados.
- Referencia primaria: Reglamento 2026, capitulos XII-XIX, paginas 36-100.
- La redaccion reglamentaria completa conserva autoridad; esta matriz normaliza su efecto de captura y calculo.

## 2. Resumen maestro

| Dominio | Articulos | Base | Oportunidades | Timer | Estado |
| --- | --- | --- | ---: | --- | --- |
| Cala | 85-94 | 20 | 1 | Revision/arranque | `COMPLETE_WITH_BLOCKED_FIELDS` |
| Piales | 95-110 | 14-30 | 3 | 2/3 min por oportunidad | `COMPLETE` |
| Colas | 111-133 | 6-12 | 3 x 3 | 20 s puerta | `COMPLETE_WITH_BLOCKED_FIELDS` |
| Toro | 134-148 | 6-20 | 1 | 5 min | `COMPLETE` |
| Terna | 149-170 | Cabeza 5-10; Pial 5-16 | 5 compartidas | 7 min | `COMPLETE` |
| Yegua | 171-185 | 6-20 | 1 | 5 min + 1 min | `COMPLETE` |
| Manganas Pie | 186-216 | 10 | 3 | 7 min | `COMPLETE` |
| Manganas Caballo | 186-217 | 10-16 | 3 | 7 min | `COMPLETE_WITH_BLOCKED_FIELDS` |
| Paso | 218-239 | 5/15/20 | Max. 2 vueltas | 3 min + 1 min | `COMPLETE` |

## 3. Cala de Caballo

### Bases y adicionales

| Regla | Valor | Condicion |
| --- | ---: | --- |
| Cala completa | 20 | Secuencia completa |
| Punta en 1/2/3 tiempos | +3/+2/+1 | Minimo 6 m; maximo 4 tiempos |
| Metro desde el septimo | +1 cada uno | Huella mas larga; >51 cm redondea arriba |
| Seis o mas lados con velocidad | +2 por lado | Sobre parado, conserva centro |
| Pata de apoyo en una marca | +1 por lado | Acumula con lados |
| Medio lado 180 grados | +1 por sentido | Un tiempo; una mano y pata dentro |
| Cambio de rectangulo de costado/dando pierna | +1 | Movimientos -> principal |

### Infracciones individuales

1. Revision de freno >1 min `-1`; >2 min otro `-1`.
2. Resistirse a enfrenar `-1`; resistirse a dar estribo `-1`.
3. Ingreso lateral inicial al rectangulo `-5`; dar espalda/voltear para movimiento `-1`.
4. Patada con una extremidad `-4`; no saludar inicio/final `-1` cada vez.
5. No correr recto ida/regreso `-1` cada vez; estrellarse en partidero `-4`; alborotarse `-1`.
6. No poner totalmente en mano `-1`; arrancar despues de 1 min `-1`; no desarrollar velocidad `-4`.
7. Cuartear de medio cuerpo hacia delante `-3`; parar sobre manos/cargarse en rienda `-2`.
8. Rebasar 90 m sin punta adicional valida `-1`; cuestionar jueces una vez `-1`; cejar/borrar huellas sin orden `-1`.
9. Abrir hocico `-1` salvo punta; rabear/espiguear `-1`; enjetarse `-1`; cachetear `-1`; estrellar/despapar/gorbetear `-1`.
10. Freno fuera de lugar `-2`; lados caminando/sin apoyo `-2` por lado; espalda al terminar lado `-5` por lado.
11. Medio lado <180 grados `-1` por lado; anticiparse >90 grados `-5` por ocasion; cambiar mano `-1`.
12. Cejar antes del cambio de rectangulo `-2`; ceja fuera de linea/centro `-1`; soltar estribo `-2`.
13. Andadura de mondingo/trote `-1`; arreo/protector roto o desplazado `-2`; perder cuarta `-1`.
14. Sangrado de hocico/ijares/barbada `-2`; titubear/disminuir lado `-4` por lado; disminuir ceja `-4`.
15. Sujetarse en descanso `-2`; descansar mano durante paso natural `-2`.

### Infracciones al equipo

- Revisor de punta que no participa en otra faena `-5 TEAM`.
- Revisor que ingresa al rectangulo `-2 TEAM`.

### DQ (36 causas oficiales)

Freno/arreo prohibido o cambio; entrada/salida incorrecta del rectangulo; alteraciones de cola/crin; competidor distinto; no ir a galope; vuelta fuera de lados; reparo/levantarse de manos; punta antes de 60 m o parar antes de 70 m; negativa a enfrenar/estribar; salirse del rectangulo; no parar al llamado; no cambiar de rectangulo; caida de caballo; caida/apearse del jinete; segunda discusion; cuarta ausente/mal ubicada; cadenilla incorrecta; abrir/manquear rienda; apoyo para no caer; faena incompleta/negativa; romper secuencia/repetir; dos manos; caballo presentado por otro equipo en misma fase; >2 min sin arrancar; no cejar a 60 m; remendar arreo; no galope despues de 20 m; adelanto >90 grados en ceja; personas cerca; no volver de frente; presentador diferente; salida incorrecta tras freno; cambio freno/cabalgadura; patada doble; retirarse del ruedo tras revision.

## 4. Piales en el Lienzo

### Bases

| Base | Puntos |
| --- | ---: |
| Lazo de verijas | 14 |
| Remolineado adelante | 18 |
| Remolineado atras | 20 |
| Piquete adelante | 22 |
| Piquete atras | 24 |
| Rompe chaqueta por lado del lienzo | 26 |
| Floreado adelante | 28 |
| Floreado atras | 30 |

### Adicionales

- `+1` por cada metro excedente de la distancia reglamentaria, sin pisar linea.
- `+1` por detener con caballo dentro del rectangulo.
- `+2` por relleno de madera.
- `+1` por conservar todas las vueltas en la mano.
- Lazo de verijas no recibe adicionales.

### Infracciones

1. Una extremidad cruza linea de 4 m, siendo de cuenta `-4`.
2. Fallar vueltas/amarrar tarde/no tomar o soltar guia `-2`.
3. Amarrar sin pial `-2`; cabrestear >10 y hasta 20 m `-2`; caballo atravesado `-2`.
4. Caballo camina al contralienzo llevando pial `-3`.
5. Cada minuto excedente de timer 2/3 min `-2`.
6. Pial no limpio que pega en pecho `-2`; sostenerse amarrado sin pial `-4`.
7. Hacerse media llevando pial `-2`; cruzar lineas 29/32 m siendo de cuenta `-4`.
8. Persona extra con pialador `-4 TEAM`; yegua quita reata `-6` y DQ.
9. Cabrestear/arrear caballo del pialador al area de tiro `-2`.

### DQ (16)

Vueltas en suelo/sentarse; sombra/arreo; no detener antes de 90 m; rotura de reata/hondilla/nudo; perder reata; mas de una extremidad cruza 4 m; cabrestear >20 m; hacerse media; amarrar de poder a poder; relleno prohibido; tercero obstruye carrera; detener ahorcado sin mano; caballo fuera del rectangulo; tercer remate no diferente salvo excepcion; caida caballo; no estar a horcajadas.

## 5. Coleadero

### Bases y adicionales

| Caida | Base |
| --- | ---: |
| Redonda derecha | 12 |
| Media derecha | 10 |
| Sobre lomo derecha | 10 |
| Sobre lomo izquierda | 6 |
| Redonda contraria | 8 |
| Media contraria | 6 |
| Panzazo | 6 |
| Senton | 6 |
| Molinete | 6 |

Distancia antes de 30 m `+3`; 30-40 m `+2`; 40-50 m `+1`; Lola `+2`; sin apretador `+1`.

### Infracciones individuales

1. No saludar `-2`; no pachonear `-2`; no agarrar cola `-2`.
2. Apoyarse/sujetarse `-2`; dos o mas intentos de arcionar `-2` y derribada no cuenta.
3. Auxiliar entra a apoyar `-2`; perder/reventar arreo o estribo `-2`.
4. Arcionar alto/defectuoso/mano al frente/remachar botin/pisar cola `-2`.
5. Encorvarse `-2`; castigar caballo `-2`; arcionar despues de 60 m `-2`.
6. No detener caballo `-2`; estrellarlo `-2`; descubrirse `-2`.
7. Amarrar arriba de rodilla `-4` y derribada no cuenta.
8. Apretador por lado incorrecto o sombra entra antes de 5 m `-4`; mas de un apachurrador `-4`.
9. Lastimar cabalgadura `-4`; toro cae despues de 70 m `-4`.
10. Picadero/puerta fuera de turno `-2` por integrante/ocasion; rienda en ramo `-2`.

### Infracciones al equipo

Toda infraccion del apretador (ejecucion o arreos) es `TEAM`. Las infracciones previas se conservan al reponer.

### DQ (15)

Arrear caballo del coleador; toro sale por detras/contralienzo; toro entra zona 5-20 m; arrear/apachurrar >10 m; sombra >20 m; caida del coleador/cambio de caballo (`-6` acumulados); caida caballo; estribos amarrados (pierde tres); arriba de rodilla; derribo rumbo al partidero; perder continuidad; brea/sustancia; guantes; derribo con mano o solo pierna; tercero pasa cola.

## 6. Jineteo de Toro

La matriz completa esta en `FMCH_2026_DYNAMIC_SCORING_TABLES.md`.

### Adicionales no matriciales

- `+1` por minuto ahorrado de los tres iniciales, si la monta cuenta y no es Minima.
- Todas las acciones de la fila acumulan cuando se ejecutan validamente.

### Infracciones

1. Descomponerse: valor de fila `-1/-2/-3/-4/-5`.
2. Atuendo perdido/roto/desplazado `-1`; bajar sin cruzar pierna `-1`; no quedar de pie `-1`.
3. Verijero caido/de lado `-4`; sangrado `-2`.
4. Lazador/integrante sale de cuadro sin orden `-4 TEAM` por persona.
5. Quitar verijero reparando `-2`; no quitar pretal con presilla `-4`.
6. Mas de tres apretaladores `-2` por extra; aspavientos/objetos `-4` por persona.
7. Destroncar ya lazado `-4`; soguear/cuartear montado `-4`.
8. Exceder minuto 3 `-1`; exceder minuto 4 otro `-1`.

### DQ (16)

Destroncar/ahogar/sustancias; espuelas prohibidas; desmontado dentro de cajon salvo excepcion; caida/desmonte salvo barda/caporal; quitar reparos; bajar antes de terminar; irse de lado y desmontar; apoyo/ayuda; choque con companero; quitar reparos por terceros; quitar verijero antes de salida; guantes prohibidos; no poner pie primero; sombrero no permitido; chaleco ausente/prohibido; >5 min.

## 7. Terna compartida

- Cinco oportunidades para el equipo, entre cabeza y pial.
- Siete minutos, un solo floreador activo.
- Solo un lazo de cabeza y un pial califican.
- `+2` por minuto no usado, `+1` a cada lazador, solo con ambos lazos de cuenta.
- El siguiente lazador que inicia antes hace perder la oportunidad vigente y la conducta aparece como DQ.
- Un lazo/pial fallado, floreo perdido o lazo para desmontar jinete consume oportunidad.
- Rotura descalifica la oportunidad; se continua solo con oportunidades restantes.

## 8. Lazo de Cabeza

### Bases

Sencillo 5; sencillo/floreado con toro echado 5; efecto 8; floreado 10.

### Floreo

| Movimiento | Valor / relacion |
| --- | --- |
| Arracadas, espejos, resorte sencillo | +1 cada clase |
| Resorte sostenido | +2; sustituye sencillo |
| Sostenido a corvejones | +4; sustituye sencillo y sostenido |
| Giro mismo sentido | +2 |
| Giro contrario | +3; sustituye mismo sentido |
| Resorte incluyendo cabeza | +3 |
| Sostenido incluyendo cabeza | +4; sustituye anterior |
| Movimiento especificado / no especificado | +1 cada clase |
| Pararse y hacer pasada | +2 |
| Pasada con todo y caballo | +6 |

Remate atras `+2`; toro parado `+1`; primera oportunidad `+1`; solo cuernos `+2`; bozal primera `+1`; sin ayuda `+1`.

### Infracciones (19)

Destroncar `-4`; fuera de cuadro sin florear `-4`; floreo defectuoso `-1` acumulable; perder reata `-6` y DQ; media cabeza `-2`; agarrar lazada `-2`; fallar vueltas `-2`; bajar mano al fuste `-2`; encuartarse `-1`; no encuartar tras aviso `-1`; lastimar ojos `-2`; estirar joroba `-1`; seguir estirando toro caido sin pial `-6`; permitir salto de barrera `-4` y DQ; caer al pararse `-6` y DQ; no intentar cabeza `-2`; no lazar en movimiento pedido `-4`; retirar pretal/verijero antes de cabeza `-4`; arrear caballo al estirar `-4`.

### DQ (15)

Caida de lazador con lazo (`-6`); caida caballo; perder continuidad; toro no limpio; estirar lazo defectuoso; perder reata; rotura; salto de barrera; derribar sin remachar; vueltas en entrepierna; recibir ayuda por rotura de montura; sujetar toro/arrojar objeto; siguiente lazador inicia; lazar sin rematar durante floreo; fractura/muerte ya lazado termina Terna.

## 9. Pial en el Ruedo

### Bases

Sencillo 5; efecto 8; floreado 10; corvero D/I 10; contracorvero D/I 11; cuadrilero/verijero D/I 11; contracuadrilero/contraverijero D/I 12; viento derecho 13; viento izquierdo 14; contraviento derecho 15; contraviento izquierdo 16.

### Floreo y remate

La tabla de floreo es la misma de Lazo: `+1/+2/+3/+4/+6` con las mismas sustituciones. Remates: cuadrilero/verijero D/I `+2`; contra D/I `+2`; viento `+3`; viento de espalda lado izquierdo `+3`; cuadrilero/verijero de espalda izquierdo `+3`; contraviento `+4`; primera oportunidad `+1`; pial floreado corriendo ambos `+2`; giro de caballo opuesto minimo 180 grados `+1`.

### Infracciones (19)

Floreo defectuoso `-1`; pial especial cae del cuadril antes de dos patas `-2`; bajar pial con mano `-2`; agarrar lazada `-2`; fallar vueltas `-2`; bajar mano al fuste `-2`; estirar sin pial/una pata `-2`; estirar mismo lado que cabecero `-2`; mas de tres limpian `-4 TEAM`; no devolver toro `-2 TEAM`; perder reata `-6` y DQ; rozar manos pero quedar cobijado `-2`; caer al pararse `-6` y DQ; ayudas para lograr pial `-2` individual si consuma o `-2 TEAM` si no; no intentar `-2`; arrear caballo al estirar `-4`; pata entra caminando atras `-2`; estirar apezuñado `-2`; completarse despues de tres pasos/ondeadas `-2`.

### DQ (21)

Caida de lazador con pial (`-6`); caida caballo; repetir remate; perder continuidad; pegar manos sin cobijar; remendar; perder cobijo; dos patas entran caminando atras; toro no limpio; rotura; caballo/toro pisa lazada; perder reata; derribar sin remachar; vueltas en entrepierna; ayuda por rotura de montura; ayuda directa para rendir; auxiliar toma reata; contacto al levantar; siguiente lazador inicia antes; no estar a horcajadas al rematar; lesion de cabalgadura durante rutina/lazo.

## 10. Jineteo de Yegua

La matriz completa esta en `FMCH_2026_DYNAMIC_SCORING_TABLES.md`.

### Infracciones

1. No quedar de pie `-1`; descomponerse por tabla; atuendo perdido `-1`; verijero caido/de lado `-4`.
2. Demora al desmontar despues del primer minuto `-1` por minuto.
3. Mas de tres apretaladores `-2` por extra.
4. No devolver yegua `-2 TEAM`; sangrado `-2`; sogueo/cuarteo montado `-4`.
5. Arreador/integrante sale de circunferencia `-4 TEAM` por persona/ocasion.
6. Quitar verijero reparando `-2`; no quitar pretal con presilla `-4`.
7. Choque contra barda desmonta jinete `-4 TEAM`.
8. Minuto 4 de apretalamiento `-1`; minuto 5 otro `-1`.

### DQ (17)

Destroncar/ahogar/sustancias; apoyo/ayuda; desmontado dentro del cajon salvo excepcion; caida/desmonte salvo excepcion; espuelas prohibidas; irse de lado y desmontar; pegamento; encajonar para desmontar; quitar reparos; arreador desmonta; verijero se quita/cae a salida; guantes prohibidos; no pie primero; sombrero; chaleco; apearse antes de fin de reparos; >5 min.

## 11. Manganas compartidas

Tres oportunidades por suerte, tres remates distintos, siete minutos ininterrumpidos, `+1` por minuto completo ahorrado con al menos una oportunidad consumada. Segundo tiron `-2`; tercero suma otro `-2`, total `-4`; derribo despues del tercero DQ. Mangana puesta en minuto 7 y derribada `-3`. El remate se diferencia por efecto final, sentido de vueltas y posicion/movimiento final.

## 12. Manganas a Pie

### Bases y adicionales

- Sencilla con pasada 10.
- Floreada con pasada 10.
- Floreo: 2-3 pasadas `+1`; 4+ `+2`; relampago/medio efecto `+1`; arracada `+1`; resorte sencillo `+1`; giro mismo `+2`; giro contrario `+3`; espejo `+1`; movimiento especificado `+1`; no especificado `+1`; giro 180 `+1`; cambio de mano `+1`.
- Remate: Desden, Contra desden y Encontrada `+1` cada uno.
- Estirar: chorrear soltando `+1`; girando sin soltar `+2`; ahorcado `+3`; muerte `+3`; un pie al tobillo y otro desde cintura `+1`.

### Infracciones (28)

Componer atuendo/practicar `-2`; apisonar `-2`; floreo defectuoso `-1`; tiron flecha `-1`; un pie cruza 4 m `-4`; desplazarse >1 paso `-2`; no estirar `-2`; seguir >2 pasos `-2`; estirar sin mangana `-2`; apoyar mano/rodilla `-2`; hocico `-2`; sobre lomo `-2`; hocico al caer `-2`; caer lazador `-3`; panza/sentada `-4`; segundo tiron `-2`; tercer tiron total `-4`; perder reata `-6` y DQ; arreadores practican `-2 TEAM`; no devolver `-2 TEAM`; gente a pie `-2`; minuto 7 `-3`; derribo en camino `-4`; fallar chorreada de cuadril `-2`; vuelta de tanteo `-6`; mover yegua en cambio `-6 TEAM`; ahorcado levanta/descompone `-3`; personas en puertas/bardas `-2 TEAM`.

### DQ (12)

Sin pasada; dos pies cruzan 4 m; cruzar hacia barda; arreadores tapan; no rematar a tercera pasada; repetir remate; arreadores derriban; rotura; perder reata (`-6`); derribo despues del tercer tiron; perder continuidad; >7 min (no intentadas DQ).

## 13. Manganas a Caballo

### Bases

| Remate | Puntos |
| --- | ---: |
| Mascara, Loro, Gavilan | 10 |
| Rodada, Morena, Bigotona | 12 |
| Contra loro, Contra gavilan | 12 |
| Desden en Rodada/Morena/Bigotona | 13 |
| Contra Rodada/Morena/Bigotona | 13 |
| Espalda a yegua, Contra mascara o Mascara con ancas al muro | 14 |
| Contra mascara (renglon separado en fuente) | 14 |
| Contra desden | 16 |
| Desden en Contra mascara | 16 |
| Centenario | 16 |

### Adicionales

Resorte sencillo `+1`; arracada `+1`; giro mismo `+2`; giro contrario `+3`; incluir cabeza `+4`; sostenido incluyendo cabeza `+5` y sustituye; espejos `+1`; no especificado `+1`; especificado `+1`; pararse y pasadas `+1`; cambio de mano `+1`; Encontrada `+1`; tiempo `+1/min`. Centenario no admite floreo adicional.

### Infracciones (26)

Floreo defectuoso `-1`; gente a pie `-2`; una vuelta extra `-1`; dos+ vueltas extra `-2`; estirar sin mangana `-2`; no estirar/remachar `-2`; fallar vueltas `-2`; desplazarse >2 pasos `-2`; seguir yegua `-4`; sobre lomo `-2`; hocico `-2`; caida de hocico `-2`; panza/sentada `-4`; segundo tiron `-2`; tercer tiron total `-4`; perder reata `-6`; caballo de espaldas primer tiron `-6`; de espaldas segundo/tercero `-2`; vuelta tanteo `-6`; practicas arreadores `-2 TEAM`; no devolver `-2 TEAM`; cabrestear caballo `-2`; un casco cruza 4 m `-4`; minuto 7 `-3`; camino `-4`; personas en puertas/bardas `-2 TEAM`.

### DQ (15)

Mas de un casco cruza 4 m; cruzar hacia barda; arreadores tapan; arreadores derriban; no rematar a tercera pasada; repetir remate; vueltas en entrepierna; rotura; derribo despues de tercer tiron; >7 min; perder continuidad; perder reata (`-6`); no remachar; no estar montado salvo Centenario; caida caballo.

## 14. Paso de la Muerte

La matriz dinamica esta en `FMCH_2026_DYNAMIC_SCORING_TABLES.md`.

### Bases y distancia

Primera vuelta 20; segunda 15; yegua parada/caminando/trotando 5. En primera vuelta: primer cuarto `+3`, segundo `+2`, tercero `+1`. No hay distancia en segunda ni con base 5.

### Infracciones (17)

1. Arreador sin cuarta `-2` cada uno; mala posicion del brinco `-2`; espuelas en verijas `-2` y no cuentan reparos.
2. Descomponerse por tabla; sangrado `-2`; desmonte despues de minuto `-1` por minuto.
3. No quedar de pie `-1`; atuendo perdido `-1`; no devolver yegua `-2 TEAM`.
4. No brincar/permanecer en manso `-2`; puerta se cierra `-4`; cuarta no en mano `-4`.
5. Arreador invade carril/quita velocidad `-6`; destroncar de 15 m a primer cuarto `-6`; sogueo/golpe excesivo `-5`.
6. No soltarse de rienda/caballo manso dentro de dos trancos `-4`.
7. No intentar faena `-10`.

### DQ (29)

Destroncar/manosear; cuarta ausente/corta; pegamento; espuelas prohibidas; no recibir a puerta; caida del manso (`-6`); sentido/continuidad incorrecta; yegua sale por debajo; pechazo/inclinacion indebida; tapar reparos; ayuda fisica; apoyo/ayuda; >3 min; despues de segunda vuelta; encajonar para desmontar; caida/desmonte; irse de lado; tanteo >15 m; cuarta amarrada; cara atras/no horcajadas; quitar reparos; destroncar despues del primer cuarto (mas `-2` por no brincar); no poner pie primero; yegua herrada; sombrero; pasador/chaleco; apearse antes; caida caballo; lesion de cabalgadura tras salida.

## 15. Reglas manuales y auditoria

Los catalogos oficiales no eliminan los controles de adicional manual, infraccion manual o team penalty. Cada seleccion, excepcion manual, DQ, reposicion, timer y publicacion debe conservar actor, motivo cuando aplique, timestamp, intento, revision, evidencia y nota. Ningun subtotal basta como unica persistencia para una regla dinamica.
