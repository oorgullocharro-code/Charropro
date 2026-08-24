# Dependency Graph

## Product roots

- announcer-monitor.html
- broadcast-playground.html
- broadcast-studio.html
- browser-output.html
- cronometro-pantalla.html
- cronometro.html
- formato-federacion.html
- grafico-cala-detalle.html
- grafico-caladero-turno.html
- grafico-categoria.html
- grafico-coleadero-turno.html
- grafico-coleadero.html
- grafico-cronometro.html
- grafico-marcador.html
- grafico-ranking.html
- grafico-turno.html
- graficos.html
- index.html
- jueces.html
- locutores.html
- obs.html
- production-console.html
- program-main-output.html
- supervision.html
- torneo-publico.html
- torneo.html

## Main paths

- index.html -> js/app.js -> js/core/* + js/data/* + Firebase adapters
- torneo.html -> js/tournamentApp.js -> js/app.js
- torneo-publico.html -> js/views/torneo-publico.js -> js/publicPortal/* -> js/public/*
- formato-federacion.html -> formato-federacion.js -> Official Format Snapshot -> Document Model -> HTML/XLSX
- broadcast-studio.html -> Workspace -> Theme/Template -> Preview -> Program -> Routing -> Realtime
- functions/index.js -> trusted services/engines -> Admin SDK/RTDB

Parsed references include static, dynamic, HTML, CSS, configuration, tests and documentation. No-reference is not proof of death because direct URLs, registries and external callers remain possible.
