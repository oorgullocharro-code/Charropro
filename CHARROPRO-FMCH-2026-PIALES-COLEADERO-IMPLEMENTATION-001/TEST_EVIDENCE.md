# Evidencia de pruebas

## Automatizacion final

- `node --check`: 157 archivos JS/MJS aprobados.
- JSON: 27 archivos validos.
- Suite completa: 60/60 suites aprobadas.
- `git diff --check`: correcto.
- `git diff --cached --check`: correcto con staging vacio previo al commit.
- Sin lineas nuevas `debugger`, `console.log`, secretos, tokens, passwords o llaves privadas en el diff funcional.

## Cobertura deportiva dirigida

`tests/fmch-2026-piales-coleadero-scorer.test.mjs` cubre:

- ocho bases de Piales y nueve caidas de Coleadero;
- distancia numerica y bandas exclusivas;
- Verijas sin adicionales;
- tercer remate repetido;
- adicionales e infracciones manuales;
- infracciones de equipo separadas;
- Marcar 0 distinto de Descalificacion;
- Descalificacion preservando puntos malos;
- matriz Coleadero 3 x 3 y participante real;
- base anulada por condicion confirmada;
- freeze oficial e inmutabilidad;
- lectura legacy y no mutacion de Product Base;
- ausencia de cambios deportivos en otras suertes;
- fixture restringido a loopback y `demo-charropro-local`.

Regresiones aprobadas: Cala FMCH 2026, Rule Profile Engine, Attempt V2, responsive components, local seed, score protection, Portal, Broadcast y publicacion oficial dentro de la suite completa.

## Evidencia visual

- `evidence/ipad-landscape-piales.jpg`
- `evidence/ipad-portrait-piales.jpg`
- `evidence/ipad-landscape-coleadero.jpg`
- `evidence/ipad-portrait-coleadero.jpg`

Validacion real en cliente LOCAL / EMULATOR:

- Piales: ocho botones de base, pialador sintetico, tres oportunidades y control de distancia.
- Coleadero: nueve botones de caida y nombres Alejandro Prueba, Bernardo Prueba y Carlos Prueba.
- Landscape: viewport logico 1280 x 960, sin overflow horizontal y footer presente.
- Portrait: viewport logico 960 x 1280, sin overflow horizontal y footer presente.
- Desktop no agrega una diferencia relevante frente al layout landscape aprobado, por lo que no se genero una quinta captura.

El exportador de captura del navegador emulado puede repetir visualmente un mosaico del viewport en el JPEG. Las mediciones DOM de ancho, contenido y footer se tomaron en la pagina real y son la evidencia autoritativa de responsive.

## Datos y red

El fixture escribio exclusivamente datos sinteticos en RTDB Emulator `demo-charropro-local` por `http://127.0.0.1:9000`. Firebase Produccion no fue consultado ni modificado. No se ejecuto publicacion oficial, push o deploy.
