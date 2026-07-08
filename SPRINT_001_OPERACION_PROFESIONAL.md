# Sprint 001 - Operacion Profesional del Organizador

## 1. Resumen ejecutivo del sprint

Sprint 001 convierte la auditoria funcional del organizador en un plan accionable para pulir el flujo operativo antes de avanzar a Master Data. El objetivo no es agregar una plataforma nueva ni redisenar CharroPro desde cero. El objetivo es reducir riesgos de uso real cuando un organizador crea un evento con varias competencias, participantes mixtos, programa, calificador, resultados, pagina publica y produccion.

La auditoria confirma que CharroPro ya puede operar bien un flujo base por equipos y torneos especializados simples. El riesgo aparece cuando un mismo torneo/evento incluye varias competencias internas, por ejemplo:

- Competencia por equipos.
- Charro Completo.
- Caladero.
- Coleadero.
- Pialadero.
- Exhibicion.

El sprint debe ordenar la experiencia alrededor de cuatro conceptos:

- Torneo o evento: contenedor general.
- Competencia interna: define que se califica y como se rankea.
- Jornada, charreada, ronda o bloque: define cuando y quienes participan.
- Participante: puede ser equipo o individuo.

La prioridad es que el organizador no mezcle competencias, rankings, participantes ni resultados. Master Data debe esperar hasta que este flujo este claro.

## 2. Hallazgos criticos

### HC-001 - Mezcla de competencias internas en resultados o rankings

Origen: AUD-ORG-014, AUD-ORG-015.

Riesgo: Calificaciones de Caladero, Coleadero, Pialadero o Charro Completo podrian interpretarse como parte del ranking por equipos.

Impacto comercial: Critico. Un ranking equivocado durante un evento destruye confianza.

Ticket asociado: RESULTS-COMPETITIONS-001.

### HC-002 - Participantes individuales tratados como equipos

Origen: AUD-ORG-010, AUD-ORG-011.

Riesgo: El organizador puede cargar charros individuales como equipos ficticios para operar competencias especiales dentro de un torneo por equipos.

Impacto comercial: Critico. Contamina datos, rankings, sabanas e historicos.

Ticket asociado: PARTICIPANTS-001.

### HC-003 - Calificador no conectado aun a `suerteIds` por jornada/competencia

Origen: AUD-ORG-012, AUD-ORG-013.

Riesgo: Una jornada marcada como Pialadero o Caladero puede no limitar el calificador a Piales o Cala si el flujo sigue resolviendo desde `tournament.type`.

Impacto comercial: Critico. Puede hacer que el juez califique una suerte incorrecta.

Ticket asociado: COMPETITIONS-003.

### HC-004 - Pagina publica sin separacion por competencia

Origen: AUD-ORG-016, AUD-ORG-017.

Riesgo: El publico puede creer que resultados individuales o especiales suman al ranking por equipos.

Impacto comercial: Alto a critico en eventos mixtos.

Ticket asociado: PUBLIC-COMPETITIONS-001.

### HC-005 - Produccion/graficos sin contexto de competencia

Origen: AUD-ORG-018, AUD-ORG-019.

Riesgo: Marcador, OBS o locutores pueden mostrar/narrar una competencia especial como si fuera una charreada por equipos.

Impacto comercial: Alto en transmision.

Ticket asociado: PRODUCTION-COMPETITIONS-001.

## 3. Hallazgos importantes

### HI-001 - Navegacion confusa entre Programa y Programacion

Origen: AUD-ORG-001.

Riesgo: El operador puede no distinguir entre consulta oficial y configuracion del programa.

Ticket asociado: AUDIT-FIX-001.

### HI-002 - Falta de guia inicial del torneo

Origen: AUD-ORG-002, AUD-ORG-003.

Riesgo: Un usuario nuevo no sabe si primero debe crear torneo, crear competencias, cargar participantes o armar programa.

Ticket asociado: TOURNAMENT-SETUP-001.

### HI-003 - Falta pantalla `Competencias del evento`

Origen: AUD-ORG-005, AUD-ORG-006.

Riesgo: El organizador usa fase/categoria como sustituto operativo sin una pantalla clara que explique competencias internas.

Ticket asociado: COMPETITIONS-002.

### HI-004 - Categoria no visible por jornada

Origen: AUD-ORG-008.

Riesgo: Caladero Juvenil, Caladero Libre o Femenil pueden quedar diferenciados solo por texto o fase, sin claridad en programa/resultados.

Ticket asociado: PROGRAM-CATEGORY-001.

### HI-005 - Operador puede iniciar sin respaldo reciente

Origen: AUD-ORG-020.

Riesgo: Se puede iniciar evento sin Recovery reciente.

Ticket asociado: RECOVERY-002.

### HI-006 - Event Engine no registra flujo organizador

Origen: AUD-ORG-022.

Riesgo: Falta trazabilidad de creacion de torneo, jornada, participantes y activacion.

Ticket asociado: EVENT-002.

## 4. Hallazgos futuros

### HF-001 - `competitionId` unico por instancia

Origen: AUD-ORG-006.

Situacion actual: `competitionId` se mantiene igual a `competitionType` por compatibilidad.

Futuro: Si hay varias competencias independientes del mismo tipo dentro de un evento, se necesitara `competitionId` unico por instancia.

Ticket futuro: COMPETITIONS-004.

### HF-002 - Master Data de charros, caballos, asociaciones y propietarios

Origen: AUD-ORG-011.

Futuro: Crear base canonica multi-organizacion con IDs estables, privacidad y gobierno de datos.

Ticket futuro: MASTER-DATA-001.

### HF-003 - Estadisticas historicas separadas por scope

Origen: AUD-ORG-016, AUD-ORG-021.

Futuro: Separar estadisticas por `team`, `individual`, `special` y `exhibition`.

Ticket futuro: STATS-COMPETITIONS-001.

### HF-004 - Auditoria persistente en Firebase

Origen: AUD-ORG-022.

Futuro: Llevar Event Engine de memoria a persistencia autorizada.

Ticket futuro: EVENT-004.

## 5. Tickets propuestos ordenados por prioridad

### 1. AUDIT-FIX-001 - Claridad de navegacion del organizador

Objetivo: Reducir confusion inmediata entre Programa, Programacion, torneo, evento, competencia y jornada.

Alcance:

- Renombrar visualmente `Programacion` a `Configurar programa` o `Programar jornadas`.
- Mantener `Programa de Competencias` como vista oficial de consulta.
- Agregar textos de ayuda en Panel y crear torneo.
- No cambiar datos ni calculos.

Prioridad: Alta.

Dependencias: Ninguna.

Resultado esperado: Un operador nuevo entiende donde consultar y donde configurar.

### 2. TOURNAMENT-SETUP-001 - Checklist de preparacion del torneo

Objetivo: Guiar al organizador desde cero.

Alcance:

- Checklist visible: Datos del evento, competencias, participantes, programa, roles, Recovery.
- Estado simple por paso: pendiente, incompleto, listo.
- Recomendacion de flujo sin bloquear al usuario.
- No tocar calificador ni resultados.

Prioridad: Alta.

Dependencias: AUDIT-FIX-001 recomendado.

Resultado esperado: El organizador sabe que hacer antes de iniciar.

### 3. COMPETITIONS-002 - Pantalla Competencias del evento

Objetivo: Crear un lugar claro para declarar competencias internas del torneo.

Alcance:

- Listar competencias del evento.
- Crear/editar competencia interna.
- Campos minimos: nombre, tipo, scope, categoria, fase/ronda, visibilidad publica, afecta ranking por equipos.
- Mantener `competitionId = competitionType` si no se activa instancia unica todavia, o preparar campo sin romper compatibilidad.
- No conectar todavia al calificador si se quiere minimizar riesgo.

Prioridad: Critica antes de Master Data.

Dependencias: TOURNAMENT-SETUP-001 recomendado.

Resultado esperado: El evento deja de depender solo de `tournament.type`.

### 4. PROGRAM-CATEGORY-001 - Categoria competitiva por jornada

Objetivo: Permitir que el Programa de Competencias diferencie categorias sin crear Master Data completo.

Alcance:

- Agregar categoria visible por jornada/bloque.
- Mostrar categoria en tarjetas de programa.
- Usarla como separacion operativa para Caladero Juvenil, Libre, Femenil, etc.
- No modificar calculos.

Prioridad: Alta.

Dependencias: COMPETITIONS-002 recomendado, aunque puede implementarse antes como texto controlado.

Resultado esperado: El programa separa competencia, fase y categoria.

### 5. PARTICIPANTS-001 - Participantes por scope

Objetivo: Evitar que individuales se carguen como equipos ficticios.

Alcance:

- Definir `participantScope`: team, individual, exhibition.
- Adaptar alta/listado para mostrar equipos o participantes segun competencia/jornada.
- Mantener compatibilidad con torneos actuales.
- No crear Master Data todavia.

Prioridad: Critica.

Dependencias: COMPETITIONS-002.

Resultado esperado: El organizador distingue equipo vs charro individual.

### 6. COMPETITIONS-003 - Calificador usa competencia/suerteIds

Objetivo: Hacer que el calificador respete el tipo de competencia de la jornada.

Resolucion de suertes:

1. `charreada.suerteIds`.
2. `competition.suerteIds`.
3. `tournament.suerteIds`.
4. Catalogo legacy por `tournament.type`.

Alcance:

- Mostrar contexto de competencia en calificador.
- No cambiar reglas deportivas.
- No cambiar calculos.
- Validar Caladero, Coleadero, Pialadero y Charro Completo.

Prioridad: Critica.

Dependencias: COMPETITIONS-002 y PARTICIPANTS-001.

Resultado esperado: El juez solo ve y califica las suertes correctas.

### 7. RESULTS-COMPETITIONS-001 - Resultados separados por competencia/categoria

Objetivo: Evitar rankings mezclados.

Alcance:

- Selector de competencia.
- Selector o filtro por categoria cuando aplique.
- Ranking por equipos separado.
- Charro Completo separado.
- Caladero/Coleadero/Pialadero separados.
- Sabanas usando `suerteIds` de la competencia.

Prioridad: Critica.

Dependencias: COMPETITIONS-003.

Resultado esperado: Ninguna competencia especial altera la tabla general por equipos.

### 8. PUBLIC-COMPETITIONS-001 - Pagina publica con competencias separadas

Objetivo: Que el publico entienda que resultados pertenecen a competencias distintas.

Alcance:

- Pestañas o filtros por competencia.
- Leyenda de alcance: equipos, individual, especial, exhibicion.
- Programa publico agrupado por competencia, fecha y fase.
- Ranking y sabana por competencia.

Prioridad: Alta.

Dependencias: RESULTS-COMPETITIONS-001 y snapshot compatible.

Resultado esperado: El portal publico no mezcla resultados.

### 9. PRODUCTION-COMPETITIONS-001 - Produccion y graficos por competencia

Objetivo: Dar contexto correcto a OBS, graficos y locutores.

Alcance:

- Incluir `competitionType`, `competitionScope`, categoria y fase en live/current.
- Mostrar contexto en locutores.
- Preparar marcador para modo equipo o individual.
- No redisenar plantillas completas en este ticket.

Prioridad: Alta para transmision.

Dependencias: COMPETITIONS-003.

Resultado esperado: Produccion sabe que competencia esta al aire.

### 10. RECOVERY-002 - Aviso operativo de respaldo antes de iniciar

Objetivo: Reducir riesgo de operar sin respaldo.

Alcance:

- Mostrar estado de Recovery en Dashboard o checklist.
- Boton directo a Crear respaldo completo.
- No bloquear operacion.
- No cambiar JSON.

Prioridad: Importante.

Dependencias: TOURNAMENT-SETUP-001 recomendado.

Resultado esperado: El operador ve si el torneo esta protegido antes de iniciar.

### 11. EVENT-002 - Captura automatica de eventos del flujo organizador

Objetivo: Registrar eventos importantes sin cambiar comportamiento.

Alcance:

- TOURNAMENT_CREATED.
- CHARREADA_CREATED / UPDATED.
- COMPETITION_CONFIGURED.
- PARTICIPANT_CREATED.
- CHARREADA_STARTED.
- BACKUP_CREATED ya existe y se conserva.

Prioridad: Importante.

Dependencias: Event Engine actual.

Resultado esperado: Bitacora futura tendra datos desde el flujo organizador.

### 12. MASTER-DATA-001 - Modelo canonico de datos maestros

Objetivo: Crear base futura de charros, caballos, equipos, asociaciones y categorias.

Alcance:

- No iniciar hasta resolver competencias y participantes por scope.
- Seguir ARCH_DATA_GOVERNANCE.md.
- Preparar tenantId/organizationId.

Prioridad: Futuro inmediato despues del sprint.

Dependencias: COMPETITIONS-002, PARTICIPANTS-001, COMPETITIONS-003.

Resultado esperado: Master Data nace sin mezclar datos deportivos.

## 6. Dependencias entre tickets

```text
AUDIT-FIX-001
  -> TOURNAMENT-SETUP-001
      -> COMPETITIONS-002
          -> PROGRAM-CATEGORY-001
          -> PARTICIPANTS-001
              -> COMPETITIONS-003
                  -> RESULTS-COMPETITIONS-001
                      -> PUBLIC-COMPETITIONS-001
                  -> PRODUCTION-COMPETITIONS-001
          -> RECOVERY-002
          -> EVENT-002
              -> MASTER-DATA-001
```

Dependencias criticas:

- No implementar Results por competencia antes de que el calificador produzca contexto confiable.
- No implementar Public por competencia antes de que Results y Snapshot separen agregados.
- No iniciar Master Data antes de definir `participantScope` y separacion de competencias.
- No certificar Charro Completo completo hasta que el calificador use `suerteIds` de competencia.

## 7. Riesgos si no se corrigen

### Riesgos comerciales

- Cliente ve ranking incorrecto durante un evento.
- Locutor anuncia puntos de una competencia especial como ranking general.
- Publico interpreta mal la tabla publica.
- Organizador carga participantes individuales como equipos.
- Resultados historicos quedan contaminados desde el origen.

### Riesgos operativos

- Juez califica suertes que no pertenecen a la competencia.
- Programa no distingue categoria/fase/competencia.
- Produccion abre graficos con contexto equivocado.
- Evento inicia sin respaldo reciente.
- Soporte tecnico debe explicar manualmente el flujo a cada cliente.

### Riesgos de arquitectura

- Master Data nace sobre entidades mezcladas.
- `competitionId` futuro se vuelve dificil de migrar.
- Estadisticas historicas mezclan equipos, individuales y exhibiciones.
- Event Engine queda desconectado del flujo real.

## 8. Definicion de Sprint terminado

Sprint 001 se considera terminado cuando:

1. El organizador entiende el flujo recomendado desde la pantalla principal.
2. La navegacion distingue consulta oficial, configuracion de programa y resultados.
3. Existe una forma clara de definir competencias del evento o, como minimo, queda guiado el uso de tipo/fase/categoria.
4. Las jornadas muestran tipo de competencia, fase y categoria.
5. El sistema distingue visual y operativamente equipo vs participante individual.
6. El calificador usa las suertes correctas segun jornada/competencia.
7. Resultados no mezclan competencias.
8. Pagina publica puede separar competencias o queda lista para hacerlo desde snapshot.
9. Produccion, graficos y locutores reciben contexto de competencia.
10. Recovery es visible antes de operar.
11. Los eventos principales del flujo organizador quedan preparados para bitacora.
12. No se modifican reglas deportivas ni calculos oficiales.

Condicion minima para cerrar el sprint con seguridad comercial:

- AUDIT-FIX-001.
- TOURNAMENT-SETUP-001.
- COMPETITIONS-002.
- PARTICIPANTS-001.
- COMPETITIONS-003.
- RESULTS-COMPETITIONS-001.

PUBLIC-COMPETITIONS-001 y PRODUCTION-COMPETITIONS-001 pueden cerrarse en una segunda ola si el piloto no usa pagina publica ni transmision con competencias especiales, pero deben estar terminados antes de vender eventos mixtos con transmision publica.

## 9. Recomendacion de orden de implementacion

### Ola 1 - Claridad y preparacion operativa

1. AUDIT-FIX-001.
2. TOURNAMENT-SETUP-001.
3. RECOVERY-002.

Motivo: Reduce confusion sin tocar calculos ni calificador.

### Ola 2 - Modelo minimo de competencias

4. COMPETITIONS-002.
5. PROGRAM-CATEGORY-001.
6. PARTICIPANTS-001.

Motivo: Ordena torneo, competencia, categoria y participante antes de tocar calificacion.

### Ola 3 - Calificacion y resultados seguros

7. COMPETITIONS-003.
8. RESULTS-COMPETITIONS-001.

Motivo: Estos tickets reducen el riesgo mas grave: calificar o rankear en la competencia equivocada.

### Ola 4 - Exposicion publica y produccion

9. PUBLIC-COMPETITIONS-001.
10. PRODUCTION-COMPETITIONS-001.

Motivo: Una vez que el core interno separa competencias, se puede mostrar y transmitir correctamente.

### Ola 5 - Trazabilidad y base futura

11. EVENT-002.
12. MASTER-DATA-001.

Motivo: Event Engine y Master Data deben apoyarse en un flujo ya ordenado, no al reves.

## Recomendacion final

El sprint debe empezar por claridad operativa, no por datos maestros. La tentacion natural seria crear bases de charros, caballos y equipos, pero la auditoria muestra que primero hay que blindar la separacion entre competencia por equipos, competencias individuales y competencias especiales.

La mejor ruta es:

1. Hacer que el organizador entienda el camino.
2. Hacer que el programa capture competencia, categoria y participantes correctos.
3. Hacer que el calificador respete esa configuracion.
4. Hacer que resultados, publico y produccion no mezclen contextos.
5. Entonces si, iniciar Master Data con arquitectura limpia.
