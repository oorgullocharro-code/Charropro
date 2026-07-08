# Auditoria funcional del flujo del organizador

## Objetivo de la auditoria

Este documento revisa el flujo completo de un organizador que empieza a usar CharroPro desde cero. La auditoria se enfoca en claridad operativa, riesgos comerciales, pasos faltantes, navegacion, nomenclatura y preparacion para Master Data.

No se modifica codigo. No se propone cambiar reglas deportivas ni calculos. El objetivo es decidir que debe ordenarse antes de crecer hacia datos maestros, competencias internas avanzadas y operacion multi-evento.

## Resumen ejecutivo

CharroPro ya tiene una base operativa fuerte para crear torneos, registrar equipos/participantes, programar charreadas, activar una charreada, calificar, ver resultados, respaldar y publicar datos publicos. Sin embargo, el flujo del organizador todavia mezcla tres conceptos que en operacion real deben separarse con mas claridad:

- Torneo o evento.
- Competencia interna.
- Jornada, charreada, ronda o bloque de programa.

La version actual ya introdujo `Programa de Competencias` y `Tipo de competencia` por charreada/jornada, pero el flujo completo todavia no guia al organizador a configurar competencias internas antes de crear participantes, programa, resultados y rankings. Esto puede provocar confusion cuando un mismo evento tiene Competencia por equipos, Charro Completo, Caladero, Coleadero, Pialadero o Exhibicion.

El mayor riesgo antes de Master Data es que el sistema sigue orientado principalmente a equipos, mientras que varias competencias especiales son individuales. Si no se aclara este modelo, el organizador podria cargar charros individuales como si fueran equipos, mezclar categorias o interpretar rankings especiales como rankings generales.

Dictamen funcional:

- Flujo base por equipos: apto para seguir operando.
- Flujo de competencias internas mixtas: requiere ajustes antes de escalar.
- Preparacion para Master Data: no conviene iniciar datos maestros sin resolver primero nomenclatura, participantes individuales y separacion de competencias.

## 1. Entrada al sistema

### Estado actual observado

La entrada principal muestra una vista general de torneos, permite crear torneo nuevo, abrir torneo, ver programa, finalizar o congelar segun permisos. El selector superior permite cambiar torneo activo. La navegacion del torneo incluye: Panel, Programa, Equipos/Alineaciones o Participantes, Programacion, Resultados, Estadisticas, Recovery Center, Graficos, Botoneras y Conexion.

### Hallazgos

AUD-ORG-001

Modulo: Entrada / Navegacion

Descripcion: Existen dos entradas relacionadas con programa: `Programa` y `Programacion`. Una funciona como vista oficial/consulta y la otra como gestion operativa. Para un usuario nuevo, los nombres son demasiado parecidos.

Impacto comercial: Medio. Puede generar errores de flujo o preguntas frecuentes durante capacitacion.

Recomendacion: Renombrar visualmente a `Programa de Competencias` para consulta y `Configurar programa` o `Programar jornadas` para administracion.

Requiere ticket: Si.

AUD-ORG-002

Modulo: Entrada / Torneos

Descripcion: La vista distingue torneos, pero no explica todavia que un torneo puede contener varias competencias internas.

Impacto comercial: Alto si el cliente opera eventos con Caladero, Coleadero, Pialadero o Charro Completo dentro del mismo evento.

Recomendacion: Agregar una guia corta de inicio: crear torneo, definir competencias, registrar participantes, armar programa, activar jornada.

Requiere ticket: Si.

### Respuesta a preguntas

Un usuario nuevo entiende que debe crear o abrir torneo, pero no necesariamente entiende el orden recomendado despues de entrar. La diferencia entre torneo, evento y competencia todavia no esta suficientemente visible. Las acciones criticas existen, pero estan repartidas entre Panel, Programa, Programacion y Configuracion.

## 2. Crear torneo

### Estado actual observado

El modal de torneo pide:

- Nombre.
- Temporada.
- Estado.
- Tipo de torneo.
- Fecha.
- Lienzo.

El tipo de torneo controla el catalogo base de suertes: completo, caladero, coleadero, pialadero, etc.

### Hallazgos

AUD-ORG-003

Modulo: Crear torneo

Descripcion: El campo `Tipo de torneo` puede confundirse con `Tipo de competencia`. Hoy define el comportamiento global del torneo, mientras que PROGRAM-003 ya permite definir `Tipo de competencia` por jornada.

Impacto comercial: Alto. Un organizador podria crear todo el evento como `Caladero` cuando en realidad el evento incluye una competencia por equipos y un caladero especial.

Recomendacion: Mantener `Tipo de torneo` como modalidad base o plantilla inicial, pero agregar texto de ayuda que diga: "Si tu evento tiene varias competencias, usa Competencia por equipos y configura cada jornada en Programa de Competencias".

Requiere ticket: Si.

AUD-ORG-004

Modulo: Crear torneo

Descripcion: Faltan campos de identidad comercial y operativa del evento: organizador, sede completa, municipio/estado, categoria general, asociacion, responsable operativo, fechas de inicio/fin, zona horaria y patrocinadores basicos.

Impacto comercial: Medio. No bloquea calificacion, pero limita portal publico, reportes, respaldos y presentacion profesional.

Recomendacion: No agregar todo antes de Master Data, pero si definir cuales son campos minimos del evento y cuales pertenecen a settings/publicacion.

Requiere ticket: Si.

### Campos que faltan

- Organizador o empresa responsable.
- Asociacion o federacion.
- Ciudad/estado.
- Fecha de inicio y fecha de termino.
- Categoria general del evento.
- Responsable de operacion.
- Contacto operativo.
- Branding o patrocinadores basicos.

### Campos que sobran o pueden confundir

El campo `Estado` al crear torneo puede ser util para operadores avanzados, pero para un usuario nuevo podria bastar con crear en preparacion y activar despues.

### Recomendacion

Crear una pantalla posterior o asistente breve: `Preparacion del torneo`, con checklist:

1. Datos del evento.
2. Competencias.
3. Participantes.
4. Programa.
5. Roles.
6. Recovery.

## 3. Configurar competencias

### Estado actual observado

Existe catalogo tecnico `js/data/competitionTypes.js` con:

- Competencia por equipos.
- Charro Completo.
- Caladero.
- Coleadero.
- Pialadero.
- Exhibicion.

PROGRAM-003 permite elegir tipo de competencia al crear/editar una jornada o charreada. Por ahora no existe una pantalla propia de `Competencias del evento`.

### Hallazgos

AUD-ORG-005

Modulo: Competencias internas

Descripcion: No existe un paso visible para crear, nombrar o administrar competencias internas del evento. Solo se elige un tipo en cada jornada.

Impacto comercial: Alto. Para un torneo con Caladero Juvenil, Caladero Libre y Caladero Femenil, el operador debe resolverlo con fase/ronda/categoria, pero el sistema no lo guia claramente.

Recomendacion: Crear una pantalla `Competencias del evento` antes de Master Data avanzado. Debe permitir definir nombre, tipo, categoria, fase principal, visibilidad publica y si afecta ranking por equipos.

Requiere ticket: Si.

AUD-ORG-006

Modulo: Competencias internas

Descripcion: `competitionId` se mantiene igual a `competitionType`, por compatibilidad. Esto es correcto para la etapa actual, pero no representa competencias independientes del mismo tipo.

Impacto comercial: Medio ahora, alto a futuro.

Recomendacion: Documentar que categorias y fases resuelven la separacion operativa actual. Crear `competitionId` unico por instancia solo cuando el flujo lo necesite.

Requiere ticket: Futuro.

### Respuesta a preguntas

Si, se necesita una pantalla `Competencias del evento`, pero no necesariamente antes de vender una version piloto si se define bien el uso recomendado. Para evitar mezclar rankings, Resultados y Pagina Publica deben agregar selector de competencia antes de usar eventos mixtos en clientes grandes.

## 4. Programa de Competencias

### Estado actual observado

La vista oficial agrupa charreadas por dia, permite colapsar, muestra hora, fecha, fase, tipo de competencia, estado, participantes y acciones. La vista de programacion permite crear/editar charreada, elegir fase, tipo de competencia, datos de produccion, equipos/participantes y orden.

### Hallazgos

AUD-ORG-007

Modulo: Programa de Competencias

Descripcion: El selector `Tipo de competencia` esta en el lugar correcto para la etapa actual: dentro de crear/editar jornada. Sin embargo, la palabra `charreada` sigue apareciendo en varios textos, botones y estados cuando algunas competencias deberian llamarse jornada, ronda o bloque.

Impacto comercial: Medio. No rompe flujo, pero confunde en Caladero, Pialadero o Charro Completo.

Recomendacion: Usar texto dinamico: `Nueva jornada` o `Nuevo bloque de competencia` en vistas generales; conservar `charreada` solo cuando el tipo realmente sea por equipos.

Requiere ticket: Si.

AUD-ORG-008

Modulo: Programa de Competencias

Descripcion: La categoria no esta integrada de forma visible en la jornada. Actualmente hay categoria por equipo/participante, pero el programa no muestra claramente si una jornada es Juvenil, Libre, Femenil, etc.

Impacto comercial: Alto para eventos con multiples categorias por competencia.

Recomendacion: Agregar `Categoria de la jornada` o `Categoria competitiva` como campo visible en programa, reutilizando categorias existentes sin crear Master Data completo todavia.

Requiere ticket: Si.

AUD-ORG-009

Modulo: Programa de Competencias

Descripcion: Charro Completo requiere participantes individuales y una lista especifica de suertes; el programa permite elegir el tipo, pero el resto del flujo todavia no garantiza que solo se asignen participantes individuales ni que se use el orden correcto de suertes.

Impacto comercial: Alto si se opera Charro Completo real.

Recomendacion: No vender Charro Completo como flujo certificado hasta implementar COMPETITIONS-003.

Requiere ticket: Si.

### Respuesta a preguntas

El selector de competencia aparece en un lugar logico. Lo que falta es distinguir mejor `jornada/charreada/competencia`, mostrar categoria y preparar participantes individuales. Para Charro Completo falta separar claramente participante individual, caballo si aplica, y ranking individual.

## 5. Participantes

### Estado actual observado

El modulo de equipos cambia etiquetas cuando el torneo es individual. La alta rapida permite cargar nombres, categoria y asociacion. Para torneos individuales existe tarjeta de participante con caballo. Para torneos completos, el modelo principal sigue siendo equipo con roster.

### Hallazgos

AUD-ORG-010

Modulo: Participantes

Descripcion: El sistema esta fuertemente orientado a equipos. Los torneos especializados tienen soporte de participante individual, pero las competencias internas mixtas dentro de un torneo por equipos no tienen todavia un modelo claro.

Impacto comercial: Alto. Un Caladero dentro de un torneo por equipos podria capturarse como equipo ficticio o como roster incorrecto.

Recomendacion: Antes de Master Data, definir `participantScope` por competencia/jornada: team, individual, exhibition.

Requiere ticket: Si.

AUD-ORG-011

Modulo: Participantes

Descripcion: No hay una base separada de charros, caballos y asociaciones. Esto es correcto antes de Master Data, pero obliga a duplicar nombres y puede generar inconsistencias.

Impacto comercial: Medio. Es tolerable en piloto, riesgoso para historicos y clientes recurrentes.

Recomendacion: MASTER-DATA-001 debe partir de un modelo minimo: charro, caballo, equipo, asociacion, categoria y tenant.

Requiere ticket: Si.

### Antes de Master Data se necesita

- Definir si un participante individual puede coexistir con equipos dentro del mismo torneo.
- Definir como se liga un charro individual a un equipo sin sumar al ranking por equipos.
- Definir categoria competitiva sin depender solo de texto libre.
- Definir IDs estables para charros y caballos.

## 6. Calificador

### Estado actual observado

El calificador usa el torneo activo, charreada activa, equipo/participante activo, suerte activa, intento/oportunidad y botones de calificacion. Ya existe evidencia manual de tiempo y flujo de guardar/publicar. El flujo de suertes aun depende principalmente del tipo de torneo y del contexto deportivo actual.

### Hallazgos

AUD-ORG-012

Modulo: Calificador

Descripcion: PROGRAM-003 guarda `competitionType`, `competitionScope` y `suerteIds` en la jornada, pero el calificador todavia no debe considerarse conectado a esos campos.

Impacto comercial: Critico si se intenta operar competencias mixtas.

Recomendacion: COMPETITIONS-003 debe hacer que el calificador resuelva suertes en este orden: charreada.suerteIds, competition.suerteIds, tournament.suerteIds, catalogo legacy por tournament.type.

Requiere ticket: Si.

AUD-ORG-013

Modulo: Calificador

Descripcion: El juez puede entender equipo/suerte activa en flujo por equipos, pero para competencias individuales se necesita una identidad visual distinta: participante, caballo, categoria y competencia.

Impacto comercial: Alto. El juez podria calificar al contexto equivocado si el evento cambia entre equipos e individuales.

Recomendacion: Calificador debe mostrar `Tipo de competencia` y `scope` de forma clara cuando no sea competencia por equipos.

Requiere ticket: Si.

### Riesgo especifico

Si un organizador crea un torneo completo y dentro programa un Pialadero, el calificador podria seguir mostrando suertes del torneo completo si no se implementa el resolver por jornada. Por eso el campo ya guardado es preparatorio, no certificacion final del flujo.

## 7. Resultados

### Estado actual observado

Resultados muestra tabla general por fases y sabana filtrable por fase. Hay premios individuales por suerte. Actualmente no se observa selector de competencia interna ni separacion por competitionType.

### Hallazgos

AUD-ORG-014

Modulo: Resultados

Descripcion: Resultados ya separa por fase/ronda, pero no por competencia interna. En un evento mixto, una calificacion de Pialadero o Caladero podria verse en la misma vista conceptual que la competencia por equipos si el calculo no se separa.

Impacto comercial: Critico para eventos con competencias especiales.

Recomendacion: Crear `RESULTS-COMPETITIONS-001`: selector de competencia y rankings separados por `competitionType`/futuro `competitionId`.

Requiere ticket: Si.

AUD-ORG-015

Modulo: Resultados

Descripcion: La sabana actual esta orientada a suertes de equipos. Para Caladero, Coleadero, Pialadero o Charro Completo deberia cambiar a columnas relevantes y no mostrar columnas vacias.

Impacto comercial: Alto.

Recomendacion: Usar `suerteIds` de la competencia para construir sabana y exportaciones.

Requiere ticket: Si.

### Respuesta a preguntas

Si, Resultados debe tener selector de competencia. Caladero, Coleadero y Pialadero deben mostrarse como rankings especiales. Charro Completo debe tener ranking individual separado y no afectar tabla por equipos.

## 8. Pagina publica

### Estado actual observado

La pagina publica consume `publicTournaments/{tournamentId}` y renderiza snapshot v1: info, activeCharreada, currentScoreboard, generalRanking, scoresheet, leaders, schedule, lastScores, teams y stats.

### Hallazgos

AUD-ORG-016

Modulo: Pagina publica

Descripcion: El snapshot publico no aparece todavia como fuente separada por competencias internas. Publicamente, el usuario podria ver ranking general sin saber si incluye o excluye competencias especiales.

Impacto comercial: Alto.

Recomendacion: PUBLIC-COMPETITIONS-001 debe agregar pestañas o filtros por competencia: General por equipos, Charro Completo, Caladero, Coleadero, Pialadero, Exhibicion.

Requiere ticket: Si.

AUD-ORG-017

Modulo: Pagina publica

Descripcion: El publico necesita una explicacion visual cuando una competencia no afecta ranking por equipos.

Impacto comercial: Medio.

Recomendacion: Agregar textos breves como "Competencia individual, no suma al ranking por equipos".

Requiere ticket: Si.

### Respuesta a preguntas

Si, la pagina publica debe mostrar pestanas por competencia. Para evitar confusion, cada ranking debe indicar su alcance: equipos, individual, especial o exhibicion.

## 9. Produccion

### Estado actual observado

El programa oficial incluye acciones rapidas a Juez, Locutores, Graficos y OBS. Graficos y OBS leen live/current, ranking, scoreboard y plantillas. Locutores tienen pagina propia.

### Hallazgos

AUD-ORG-018

Modulo: Produccion / Graficos / OBS

Descripcion: Los graficos actuales dependen del contexto live y scoreboard. No hay garantia visible de que el marcador cambie su modo segun competencia interna.

Impacto comercial: Alto en transmision.

Recomendacion: Graficos deben recibir `competitionType`, `competitionScope` y nombre de competencia en live/current antes de operar competencias especiales.

Requiere ticket: Si.

AUD-ORG-019

Modulo: Locutores

Descripcion: El locutor necesita contexto: competencia, categoria, fase, participante/equipo y si afecta ranking.

Impacto comercial: Medio.

Recomendacion: Agregar contexto de competencia al payload de locutores cuando se conecte COMPETITIONS-003.

Requiere ticket: Si.

### Respuesta a preguntas

Si, graficos deben saber la competencia. El marcador debe tener modo Charro Completo/individual. Locutor necesita contexto de competencia para no narrar resultados como si fueran del ranking general.

## 10. Recovery

### Estado actual observado

Recovery Center existe como modulo visible, genera respaldo JSON, guarda historial local y muestra salud del torneo. No escribe en Firebase para historial ni restauracion.

### Hallazgos

AUD-ORG-020

Modulo: Recovery

Descripcion: El operador puede generar respaldo, pero aun no existe una advertencia obligatoria antes de iniciar torneo si no hay respaldo reciente.

Impacto comercial: Alto. Un cliente en vivo puede empezar sin respaldo.

Recomendacion: Agregar aviso no bloqueante en Dashboard: "Este torneo no tiene respaldo reciente" con boton a Recovery.

Requiere ticket: Si.

AUD-ORG-021

Modulo: Recovery

Descripcion: El respaldo incluye datos del torneo, pero cuando existan competencias internas por instancia, el manifest debera incluir conteo de competencias y scopes.

Impacto comercial: Bajo ahora, medio a futuro.

Recomendacion: Actualizar manifest en RECOVERY-002 despues de COMPETITIONS-002.

Requiere ticket: Futuro.

### Respuesta a preguntas

El operador entiende el estado de proteccion si entra a Recovery, pero falta hacerlo visible antes de operar. Falta un boton o alerta previa al inicio real del torneo.

## 11. Event Engine

### Estado actual observado

Existe Event Engine en memoria y Recovery registra `BACKUP_CREATED`. No se escribe en Firebase ni localStorage desde eventos.

### Eventos que deberian generarse en flujo organizador

- TOURNAMENT_CREATED al crear torneo.
- TOURNAMENT_OPENED al abrir torneo.
- TOURNAMENT_STATUS_CHANGED al activar/finalizar/congelar.
- COMPETITION_CONFIGURED al definir tipo de competencia en jornada.
- CHARREADA_CREATED al crear jornada/charreada.
- CHARREADA_UPDATED al editar jornada/charreada.
- CHARREADA_STARTED al activar.
- PARTICIPANT_CREATED al crear equipo o participante.
- PARTICIPANT_ASSIGNED_TO_CHARREADA al asignar participantes al programa.
- SCORE_PUBLISHED al publicar calificacion.
- PUBLIC_SNAPSHOT_PUBLISHED al generar snapshot publico.
- BACKUP_CREATED al generar respaldo.
- RECOVERY_STATUS_CHANGED cuando cambia salud del torneo.

### Hallazgos

AUD-ORG-022

Modulo: Event Engine

Descripcion: El motor esta listo como base, pero el flujo organizador todavia no registra eventos de creacion de torneo, jornada, participantes o activacion.

Impacto comercial: Medio ahora, alto para auditoria y trazabilidad futura.

Recomendacion: EVENT-002 debe capturar eventos automaticos del flujo organizador sin cambiar comportamiento.

Requiere ticket: Si.

## 12. Riesgos detectados

### Riesgos criticos

1. Mezcla de competencias internas en resultados o rankings.
2. Participantes individuales tratados como equipos dentro de eventos mixtos.
3. Calificador sin resolver `suerteIds` desde la jornada/competencia.
4. Pagina publica mostrando ranking general sin aclarar alcance.
5. Graficos/OBS sin contexto de competencia en eventos especiales.

### Riesgos altos

1. Nombres de navegacion similares: Programa y Programacion.
2. Falta de pantalla `Competencias del evento`.
3. Falta de categoria visible por jornada.
4. Operador puede iniciar sin respaldo reciente.
5. Falta de eventos de auditoria en pasos organizativos.

### Riesgos medios

1. Tipo de torneo vs tipo de competencia puede confundirse.
2. Campos de torneo insuficientes para portal publico profesional.
3. Master Data podria duplicar charros/caballos si se inicia antes de definir scopes.
4. Charro Completo no tiene experiencia visual propia.
5. Locutores no tienen contexto de competencia.

### Riesgos bajos

1. Textos heredados con la palabra charreada en contextos donde jornada seria mas general.
2. Algunas exportaciones futuras no incluyen competencia.
3. El respaldo no cuenta competencias internas todavia.

## 13. Recomendaciones priorizadas

### Critico antes de Master Data

1. Definir flujo visual de `Competencias del evento`.
2. Conectar calificador a `suerteIds` de jornada/competencia.
3. Separar resultados por competencia.
4. Definir modelo minimo de participante individual dentro de torneo mixto.
5. Definir categoria competitiva por jornada/competencia.

### Importante

1. Renombrar navegacion para reducir confusion: Programa de Competencias vs Configurar programa.
2. Agregar checklist de preparacion del torneo.
3. Mostrar alerta de Recovery en Dashboard si no hay respaldo reciente.
4. Agregar contexto de competencia en locutores, graficos y live/current.
5. Agregar eventos automaticos del flujo organizador.

### Futuro

1. `competitionId` unico por instancia.
2. Master Data de charros, caballos, asociaciones y propietarios.
3. Portal publico con pestañas por competencia.
4. Estadisticas historicas separadas por scope.
5. Auditoria persistente en Firebase.

## 14. Roadmap sugerido

### AUDIT-FIX-001 - Claridad de navegacion del organizador

Objetivo: Renombrar entradas y textos para separar consulta oficial, configuracion del programa y acciones de torneo.

Alcance:

- `Programa` -> `Programa de Competencias`.
- `Programacion` -> `Configurar programa`.
- Textos de ayuda para torneo/evento/competencia/jornada.
- No tocar calculos ni Firebase.

Prioridad: Alta.

### COMPETITIONS-002 - Pantalla Competencias del evento

Objetivo: Crear vista para definir competencias internas del torneo.

Alcance:

- Crear competencia por equipos, Charro Completo, Caladero, Coleadero, Pialadero, Exhibicion.
- Nombre visible.
- Tipo.
- Scope.
- Categoria.
- Fase/ronda principal.
- Si afecta ranking por equipos.
- No cambiar calificador todavia.

Prioridad: Critica antes de Master Data.

### COMPETITIONS-003 - Calificador usa competencia/suerteIds

Objetivo: El calificador debe decidir suertes desde jornada/competencia.

Orden de resolucion:

1. `charreada.suerteIds`.
2. `competition.suerteIds`.
3. `tournament.suerteIds`.
4. Catalogo legacy por `tournament.type`.

Prioridad: Critica.

### RESULTS-COMPETITIONS-001 - Resultados separados por competencia

Objetivo: Agregar selector de competencia y separar ranking/sabana/premiacion.

Alcance:

- Ranking por equipos.
- Ranking Charro Completo.
- Rankings Caladero/Coleadero/Pialadero.
- Exhibiciones sin ranking oficial si aplica.

Prioridad: Critica para eventos mixtos.

### PUBLIC-COMPETITIONS-001 - Pagina publica por competencia

Objetivo: Mostrar programa, ranking y sabana publica separados por competencia.

Alcance:

- Pestañas por competencia.
- Leyenda de alcance.
- No mezclar ranking individual con equipos.

Prioridad: Alta.

### MASTER-DATA-001 - Modelo canonico de datos maestros

Objetivo: Crear base de charros, caballos, equipos, asociaciones y categorias con gobierno de datos.

Dependencias:

- ARCH_DATA_GOVERNANCE.md.
- COMPETITIONS-002.
- Definicion de participantScope.

Prioridad: Despues de resolver competencias internas.

## Conclusion del auditor

CharroPro esta listo para operar un flujo base por equipos y torneos especializados simples. Para avanzar hacia eventos comerciales mas complejos y Master Data, el siguiente salto no debe ser almacenar mas datos, sino ordenar el modelo operativo:

- El torneo es el contenedor.
- La competencia define que se califica y como se rankea.
- La jornada/charreada define cuando y quienes participan.
- El participante puede ser equipo o individuo.

La prioridad inmediata debe ser evitar mezclas de rankings y dar al organizador un camino claro. Master Data debe esperar hasta que `Competencias del evento`, `participantScope`, `suerteIds` por competencia y resultados separados esten suficientemente definidos.
