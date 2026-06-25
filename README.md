# CharroPro Organizado

Primera base ordenada para gestionar charreadas y torneos de charreria.

## Que contiene

- Administracion de torneos, equipos, alineaciones y charreadas.
- Calificador por botonera con flujo de suertes, oportunidades y cronometro.
- Resultados por equipo, sabana resumida y premiacion individual basica.
- Vista OBS para graficos en vivo.
- Vista de locutores con informacion del turno actual.
- Firebase Realtime Database para estado en vivo rapido entre dispositivos.
- Sincronizacion opcional hacia un Google Apps Script.

## Archivos principales

- `index.html`: aplicacion principal.
- `obs.html`: grafico vivo para OBS/vMix.
- `locutores.html`: vista para narradores.
- `js/data/suertes.js`: catalogo de suertes, bases, adicionales, infracciones y descalificaciones.
- `js/core/scoring.js`: calculos de puntos, totales y rankings.
- `js/core/state.js`: guardado local y estado compartido.
- `js/core/flow.js`: orden de avance durante la charreada.
- `js/core/sync.js`: paquete vivo y envio opcional a Google Sheets.
- `js/core/firebaseSync.js`: envio y lectura del estado vivo compacto en Firebase.
- `js/core/officialFormat.js`: arma la hoja por equipo en el formato Federacion 2024-2028.
- `js/core/xlsx.js`: genera el archivo Excel `.xlsx` con una pestana por equipo.
- `google-apps-script/formato-federacion.gs`: receptor para Google Sheets.
- `google-apps-script/formato-federacion-visual.gs`: receptor visual basado en el formato que ya funcionaba en Sheets.

## Reglas de trabajo con IA

Cuando pidas cambios, usa instrucciones de este estilo:

```text
Modifica solamente el modulo indicado. No reescribas toda la app.
Respeta el modelo de datos de js/core/state.js.
Respeta el catalogo de js/data/suertes.js salvo que te pida cambiar reglamento.
Antes de editar, dime que archivos vas a tocar.
Despues, dime como probarlo.
```

Esta version es una base de trabajo. Antes de usarla en torneo real, hay que validar cada criterio contra el reglamento oficial y contra tu forma de operar en lienzo.

## Formato Federacion

La app envia el paquete vivo normal y, ademas, agrega `formatoFederacion`.

Ese paquete contiene una hoja por equipo:

- encabezado: evento, hora, equipo, fecha, capitan y lugar;
- bloques: Cala, Piales, Coleadero, Jineteo de Toro, Terna, Jineteo de Yegua, Manganas a Pie, Manganas a Caballo y Paso de la Muerte;
- en Cala, los adicionales caen en su columna oficial (`LD`, `LI`, `MD`, `MI`, `PC`) y la cuadricula de malos separa cada infraccion: abreviatura arriba y valor abajo;
- en la punta de Cala, los adicionales por distancia empiezan en el septimo metro; el metro 6 no suma distancia;
- control acumulado despues de cada suerte: puntos anteriores, puntos de la suerte y nuevo acumulado;
- total de puntos malos;
- puntuacion final.

La descarga local del formato Federacion es un `.xlsx`, no CSV, porque Excel/Google Sheets solo pueden tener varias pestanas cuando el archivo es un libro de Excel.

Para Google Sheets, usa de preferencia `google-apps-script/formato-federacion-visual.gs`. Ese script recibe `data.detalles`, crea una pestana por equipo y dibuja la hoja con colores, anchos, celdas combinadas y totales.

## Firebase en vivo

Firebase se usa solo para el estado rapido de transmision: equipo en turno, suerte, oportunidad, cronometro, ranking y diseno grafico. Google Sheets sigue siendo el respaldo oficial y el historial de hojas por equipo.

Base configurada:

```text
https://charropro-e8a68-default-rtdb.firebaseio.com
```

Ruta usada por la app:

```text
charropro/live/{tournamentId}
```

Durante pruebas, las reglas de Realtime Database pueden quedar asi:

```json
{
  "rules": {
    "charropro": {
      ".read": true,
      ".write": true
    }
  }
}
```

Para produccion conviene cerrar estas reglas con autenticacion, pero para probar tablet, cabina, locutores y OBS en el mismo torneo esto permite verificar que todo sincroniza.
