# Gobierno de Datos y Proteccion de Datos de CharroPro

## 1. Filosofia de datos

CharroPro debe manejar datos deportivos de forma profesional, segura, organizada y escalable. El sistema no debe ser solamente una herramienta de captura de calificaciones; debe convertirse gradualmente en un registro deportivo confiable para torneos, equipos, asociaciones, jueces, locutores, produccion y futuras ligas.

La informacion deportiva tiene valor historico, comercial, operativo y cultural. Por eso debe tratarse con disciplina: separar lo publico de lo privado, evitar duplicados, preservar trazabilidad y permitir exportaciones responsables.

### Principios

- Minimo dato necesario: recolectar solo lo que se necesita para operar, publicar o auditar.
- Separacion entre datos publicos y privados: no mezclar resultados deportivos con informacion personal sensible.
- Trazabilidad: cada cambio relevante debe poder explicarse.
- Consentimiento: cualquier dato personal, imagen o publicacion debe tener base de autorizacion.
- Control por organizacion: cada cliente u organizacion debe controlar sus propios datos.
- Exportabilidad: los datos operativos deben poder exportarse en formatos abiertos.
- Privacidad por diseno: la arquitectura debe prevenir exposiciones accidentales.
- Seguridad por defecto: si hay duda, un dato debe ser privado hasta que se marque como publicable.

## 2. Clasificacion de datos

CharroPro debe clasificar toda informacion en cuatro niveles.

### Publico deportivo

Datos que pueden mostrarse en resultados, transmision, estadisticas o pagina publica cuando el torneo lo permita.

Ejemplos:

- Nombre deportivo.
- Equipo.
- Asociacion.
- Categoria.
- Resultados.
- Estadisticas.
- Fotografia deportiva autorizada.
- Caballo en competencia.
- Records.
- Posiciones, rankings y sabanas de resultados.
- Participacion por charreada o fase.

Politica:

- Puede aparecer en graficos, OBS, pagina publica, reportes deportivos y estadisticas.
- Debe evitar datos personales innecesarios.
- Debe estar vinculado a autorizacion del torneo u organizacion.

### Interno operativo

Datos utiles para operar el evento, pero que no deben mostrarse al publico por defecto.

Ejemplos:

- Notas internas.
- Observaciones de jueces.
- Historial administrativo.
- Datos de contacto operativo.
- Asignacion de roles.
- Notas de produccion.
- Comentarios de locutores no publicados.
- Estado logistico de charreadas.

Politica:

- Visible solo para roles internos autorizados.
- Puede usarse en bitacora, programa operativo y Recovery Center.
- No debe publicarse en pagina publica ni graficos sin aprobacion explicita.

### Privado personal

Datos personales protegidos.

Ejemplos:

- Telefono.
- Correo.
- Domicilio.
- Fecha de nacimiento completa.
- Documentos.
- Contacto de emergencia.
- Identificadores internos de usuario.

Politica:

- Debe almacenarse solo si es necesario.
- Debe estar separado de los datos publicos deportivos.
- Debe tener controles estrictos de lectura y escritura.
- No debe exportarse en reportes publicos.

### Sensible / restringido

Datos que idealmente no deben almacenarse salvo necesidad justificada y autorizada.

Ejemplos:

- Informacion medica.
- Identificaciones oficiales completas.
- Datos fiscales.
- Datos biometricos.
- Informacion financiera.

Politica:

- Evitar almacenarlos en CharroPro v1.0.
- Si en el futuro se requieren, deben vivir en un modulo especializado, con cifrado, reglas estrictas, consentimiento y auditoria.
- Nunca deben aparecer en pagina publica, graficos, OBS, bitacoras abiertas ni exports deportivos ordinarios.

## 3. Entidades principales

### Charros

Politica:

- Deben tener identificador unico estable.
- El nombre deportivo puede ser publico.
- Datos personales deben separarse de datos deportivos.
- Historial de participacion, suertes y resultados debe poder conservarse.
- Deben manejarse duplicados con proceso de fusion auditado.

Datos publicos sugeridos:

- Nombre deportivo.
- Asociacion.
- Equipo actual.
- Categoria.
- Resultados deportivos.
- Fotografia autorizada.

Datos privados sugeridos:

- Telefono.
- Correo.
- Fecha de nacimiento completa.
- Documentos.
- Contacto de emergencia.

### Caballos

Politica:

- Deben tener identificador unico estable.
- Su nombre en competencia puede ser publico.
- Propietario o datos administrativos pueden ser internos o privados segun autorizacion.
- Debe conservarse historial deportivo sin duplicar fichas.

Datos publicos sugeridos:

- Nombre deportivo.
- Equipo o charro asociado en competencia.
- Resultados donde participa.

Datos privados sugeridos:

- Propietario.
- Documentacion.
- Informacion veterinaria si existiera.

### Equipos

Politica:

- Son entidades deportivas publicables.
- Deben vincularse a organizacion, asociacion, categoria y torneos.
- Deben tener historial de resultados.
- No deben depender solo del nombre como identificador.

Datos publicos sugeridos:

- Nombre del equipo.
- Asociacion.
- Categoria.
- Logo autorizado.
- Resultados.
- Integrantes deportivos autorizados.

### Asociaciones

Politica:

- Deben tener identificador unico.
- Pueden agrupar equipos, charros, torneos y jueces.
- Deben poder operar como tenant u organizacion en modelos federados.

Datos publicos sugeridos:

- Nombre.
- Estado/region.
- Equipos afiliados.
- Torneos asociados.

### Propietarios

Politica:

- La informacion de propietarios debe tratarse como interna o privada, salvo autorizacion expresa.
- Debe vincularse principalmente a caballos, equipos o patrocinadores.

Datos privados sugeridos:

- Contacto.
- Datos fiscales.
- Documentacion.

### Jueces

Politica:

- El nombre publico del juez puede mostrarse cuando el torneo lo autorice.
- Observaciones internas, permisos, roles y auditoria no son datos publicos.
- Su actividad debe quedar trazada para auditoria operativa.

Datos publicos sugeridos:

- Nombre visible.
- Rol en el evento si se autoriza.

Datos internos:

- Asignaciones.
- Sesiones.
- Cambios de calificacion.
- Observaciones operativas.

### Locutores

Politica:

- Datos publicos dependen de autorizacion del evento.
- Notas de locucion, guiones y asignaciones son internos.
- Puede existir perfil publico futuro para produccion o transmision.

### Usuarios

Politica:

- Son cuentas de acceso, no perfiles deportivos por defecto.
- Deben separarse de charros, jueces o administradores aunque una persona pueda tener varios roles.
- UID, correo y permisos no deben exponerse publicamente.

### Torneos

Politica:

- Son unidades operativas principales.
- Deben aislar datos por `tournamentId`.
- Pueden pertenecer a una organizacion o tenant.
- Datos publicos del torneo deben separarse del Core privado.

Datos publicos sugeridos:

- Nombre.
- Sede.
- Fechas.
- Programa.
- Resultados.
- Ranking.
- Patrocinadores autorizados.

### Patrocinadores

Politica:

- Pueden ser publicos si existe autorizacion comercial.
- Contratos, pagos y condiciones son privados o restringidos.
- Debe existir control de donde se muestran: pagina publica, graficos, OBS, reportes.

### Medios / produccion

Politica:

- Datos de produccion son internos.
- Enlaces a OBS, graficos, locutores o streaming no deben publicarse si permiten control operativo.
- Credenciales de plataformas externas nunca deben almacenarse en texto visible.

## 4. Propiedad de los datos

### Orgullo Charro / CharroPro propio

Cuando Orgullo Charro opera sus propios torneos, CharroPro administra datos deportivos propios. En este escenario CharroPro puede definir politicas editoriales, publicacion de resultados, historicos y estadisticas.

### Cliente organizador

Cuando un organizador independiente usa CharroPro, el organizador es responsable de sus datos. CharroPro opera como plataforma tecnologica y debe facilitar exportacion, correccion, respaldo y controles de acceso.

### Federacion / Asociacion

Cuando una federacion o asociacion utiliza CharroPro, la organizacion conserva propiedad de sus datos. CharroPro debe operar como plataforma tecnologica, respetando reglas de publicacion, permisos, historicos y privacidad definidos por esa organizacion.

### Modelo SaaS

En un modelo SaaS, cada organizacion debe tener separacion logica por `tenantId`. Ninguna organizacion debe poder leer, editar, exportar o inferir datos privados de otra.

## 5. Modelo multi-organizacion

### Identificadores base

- `tenantId`: unidad mayor de aislamiento comercial o SaaS.
- `organizationId`: asociacion, cliente, federacion o entidad operadora.
- `tournamentId`: torneo especifico.

### Regla principal

Ningun dato privado debe mezclarse entre organizaciones.

### Lineamientos

- Todo dato maestro debe pertenecer a un `tenantId` o tener una razon clara para ser global.
- Todo torneo debe tener `organizationId` y, en SaaS, `tenantId`.
- Datos publicos pueden replicarse a snapshots publicos, pero nunca deben arrastrar campos privados.
- La arquitectura debe permitir que un charro, caballo o equipo exista en una organizacion sin contaminar otra.
- Si en el futuro existe base nacional o federada, debe tener reglas explicitas de comparticion.

## 6. Permisos y roles

### Super Admin

Puede:

- Administrar tenants y organizaciones.
- Configurar roles globales.
- Revisar auditoria tecnica.
- Ejecutar tareas de soporte avanzado.

No debe:

- Modificar resultados deportivos sin proceso auditado.
- Acceder a datos privados sin justificacion operativa.

### Admin Organizacion

Puede:

- Administrar torneos de su organizacion.
- Crear equipos, usuarios y permisos internos.
- Exportar datos de su organizacion.
- Administrar configuracion publica.

No puede:

- Acceder a otras organizaciones.
- Ver datos sensibles sin permiso especifico.

### Supervisor Torneo

Puede:

- Activar charreadas.
- Supervisar calificacion.
- Gestionar programa.
- Publicar resultados.
- Generar respaldos.
- Ver bitacora operativa del torneo.

No puede:

- Cambiar reglas deportivas.
- Acceder a datos privados fuera del torneo.

### Juez

Puede:

- Ver charreada activa.
- Calificar segun permisos.
- Ver datos deportivos necesarios para juzgar.

No puede:

- Activar charreadas.
- Editar configuracion del torneo.
- Acceder a datos privados no necesarios.
- Ver auditorias administrativas completas.

### Capturista

Puede:

- Capturar informacion operativa autorizada.
- Cargar equipos o alineaciones si se le permite.

No puede:

- Publicar resultados oficiales si no tiene permiso.
- Cambiar permisos o reglas.

### Locutor

Puede:

- Ver informacion deportiva publica o preparada para narracion.
- Ver programa, equipos, participantes y estadisticas autorizadas.

No puede:

- Editar calificaciones.
- Ver datos privados.
- Acceder a auditoria o recuperacion.

### Produccion

Puede:

- Ver programa operativo.
- Usar graficos, OBS y datos de transmision.
- Ver notas internas de produccion si esta autorizado.

No puede:

- Modificar calificaciones.
- Acceder a datos personales protegidos.

### Consulta publica

Puede:

- Ver resultados, programa, ranking y datos deportivos publicados.

No puede:

- Ver rutas privadas.
- Ver usuarios, roles, correos, telefonos, auditoria ni backups.

### Invitado

Puede:

- Acceder solo a lo que la organizacion exponga publicamente.

No puede:

- Escribir datos.
- Exportar informacion privada.
- Ver modulos internos.

## 7. Consentimiento y Aviso de Privacidad

CharroPro debe contar con lineamientos de privacidad antes de construir una base maestra de personas, caballos y equipos.

Debe contemplar:

- Aviso de privacidad.
- Consentimiento para uso de datos personales.
- Consentimiento para uso de imagen o fotografia si aplica.
- Autorizacion para publicacion de resultados deportivos.
- Mecanismo para solicitar correccion de datos.
- Mecanismo para solicitar eliminacion de datos privados cuando proceda.
- Separacion clara entre resultado deportivo publico y dato personal privado.

Nota: este documento no reemplaza un aviso legal definitivo. Debe ser revisado por asesoria legal antes de operar datos personales a gran escala.

## 8. Retencion y eliminacion

### Datos deportivos historicos

Los resultados, rankings, records, participaciones y estadisticas pueden conservarse de forma prolongada por su valor deportivo e historico, siempre que no incluyan datos privados innecesarios.

### Datos privados

Deben conservarse solo mientras exista necesidad operativa, contractual o legal. Deben poder corregirse y, cuando proceda, eliminarse o anonimizarse.

### Backups

Los respaldos deben tener politica de conservacion. No deben conservarse indefinidamente sin control. Deben protegerse porque pueden contener datos privados.

### Eventos y auditoria

Eventos de auditoria y seguridad deben conservarse de forma protegida. No deben editarse ni eliminarse desde interfaces ordinarias. Si se requiere eliminar datos personales, la auditoria debe conservar evidencia sin exponer informacion privada innecesaria.

### Solicitudes de eliminacion o correccion

CharroPro debe permitir registrar solicitudes de correccion, fusion de duplicados o eliminacion. Toda accion debe auditarse.

## 9. Exportacion de datos

CharroPro debe permitir exportar informacion operativa y deportiva de forma controlada.

Exportaciones sugeridas:

- Torneo completo.
- Base de equipos.
- Charros.
- Caballos.
- Resultados.
- Estadisticas.
- Auditoria.
- Respaldos.
- Programa.
- Snapshot publico.

Formatos sugeridos:

- JSON para respaldo tecnico.
- CSV para interoperabilidad.
- Excel para operacion administrativa.
- PDF para reportes oficiales o publicos.

Politica:

- Las exportaciones publicas no deben incluir datos privados.
- Las exportaciones completas deben requerir rol autorizado.
- Cada exportacion sensible debe generar evento de auditoria.

## 10. Auditoria

Los cambios relevantes deben generar eventos en el Event Engine.

Eventos auditables:

- Creacion de ficha.
- Edicion de ficha.
- Fusion de duplicados.
- Eliminacion logica.
- Cambio de permisos.
- Exportacion.
- Restauracion.
- Publicacion de datos.
- Correccion de resultados.
- Activacion de charreada.
- Publicacion de snapshot publico.
- Generacion de respaldo.

Politica:

- La auditoria debe indicar actor, timestamp, source, entidad afectada y payload minimo.
- No debe exponer datos sensibles si no es necesario.
- Los eventos de auditoria deben ser inmutables.

## 11. Fotos y archivos

### Almacenamiento

Las fotos y archivos deben almacenarse en un sistema de archivos o storage controlado, no como datos pesados dentro del estado principal del torneo.

### Quien puede subir

Solo roles autorizados:

- Admin Organizacion.
- Supervisor Torneo.
- Produccion, si esta permitido.
- Capturista, si se habilita para carga documental.

### Quien puede publicar

La publicacion debe requerir autorizacion explicita:

- Publico deportivo: imagen autorizada para resultados, transmision o ficha publica.
- Interno operativo: imagen visible solo para operacion.
- Privado: documento o archivo restringido.

### Relacion con consentimiento

Antes de mostrar fotos de personas en pagina publica, graficos, perfiles o reportes, debe existir consentimiento o base de autorizacion definida por la organizacion.

### Reglas

- No mezclar fotos publicas con documentos privados.
- No publicar documentos oficiales.
- No usar imagenes privadas en graficos o pagina publica.
- Registrar quien subio y quien publico.

## 12. Duplicados

CharroPro debe asumir que habra duplicados, especialmente en charros, caballos y equipos.

### Deteccion

Posibles criterios:

- Nombre normalizado.
- Asociacion.
- Equipo.
- Fecha de nacimiento parcial si esta autorizada.
- Historial de participacion.
- Caballo o charro asociado.

### Fusion

La fusion debe:

- Requerir rol autorizado.
- Mostrar registros candidatos.
- Elegir registro principal.
- Mover historial deportivo.
- Conservar alias o nombres alternativos.
- Registrar evento de auditoria.

### Conservacion de historial

No debe borrarse historial deportivo al fusionar. Si un resultado fue publicado bajo un nombre anterior, debe mantenerse trazabilidad.

### Politica

- No fusionar automaticamente sin confirmacion.
- No depender solo del nombre.
- No eliminar registros duplicados sin dejar rastro.

## 13. Recomendaciones para Master Data

MASTER-DATA-001 debe construir primero:

- Modelo canonico de entidades.
- Campos minimos por entidad.
- Separacion publico/privado.
- IDs unicos estables.
- Relacion con `tenantId`.
- Relacion con `organizationId`.
- Politica de duplicados.
- Politica de exportacion.
- Auditoria de cambios.
- No publicar datos privados.

### Campos minimos recomendados

Charro:

- `participantId`
- `tenantId`
- `organizationId`
- `displayName`
- `publicName`
- `status`
- `publicProfile`
- `privateProfile`

Caballo:

- `horseId`
- `tenantId`
- `organizationId`
- `displayName`
- `publicProfile`
- `privateProfile`

Equipo:

- `teamId`
- `tenantId`
- `organizationId`
- `name`
- `associationId`
- `category`
- `publicProfile`

Asociacion:

- `associationId`
- `tenantId`
- `name`
- `region`
- `publicProfile`

Usuario:

- `userId`
- `tenantId`
- `organizationId`
- `role`
- `status`
- `privateProfile`

### Reglas iniciales para MASTER-DATA-001

- No migrar todo de golpe.
- No mezclar usuarios con charros.
- No usar nombre como ID.
- No publicar datos privados.
- No crear base nacional hasta tener tenant/organizacion resueltos.
- Todo cambio importante debe generar evento.

## 14. Riesgos

### Mezclar datos de organizaciones

Riesgo comercial alto. Puede romper confianza de clientes y federaciones. La separacion por `tenantId` y `organizationId` es obligatoria antes de escalar SaaS.

### Publicar datos privados

Riesgo legal y reputacional. Pagina publica, OBS, graficos y reportes deben consumir solo datos publicos o autorizados.

### Duplicados

Riesgo estadistico e historico. Si un charro o caballo aparece varias veces, las estadisticas pierden valor y la IA futura dara conclusiones incorrectas.

### Borrar historial

Riesgo deportivo. Los resultados publicados y eventos historicos no deben eliminarse sin proceso controlado.

### No tener consentimiento

Riesgo legal y comercial. El uso de imagen, datos personales y publicaciones debe estar autorizado.

### Depender solo del nombre como identificador

Riesgo tecnico alto. Nombres repetidos, abreviaciones y errores de captura provocaran duplicados y resultados mal asociados.

### Backups sin control

Riesgo de privacidad. Un respaldo completo puede contener datos privados. Debe protegerse y tener politica de conservacion.

### Exports sin filtros

Riesgo de fuga de datos. Toda exportacion debe tener alcance claro: publica, operativa, completa o auditoria.

## 15. Conclusion del arquitecto

CharroPro no debe ser solo una base de datos. Debe convertirse en un registro deportivo gobernado, seguro y preparado para clientes, asociaciones, federaciones y futuras ligas.

La ventaja comercial de CharroPro no estara solamente en capturar resultados, sino en cuidar la integridad del dato deportivo durante anos. Para lograrlo, la arquitectura debe separar datos publicos de privados, aislar organizaciones, registrar auditoria, permitir exportacion responsable y evitar que el crecimiento futuro convierta el sistema en una mezcla de nombres duplicados y datos sin control.

Antes de construir Master Data, CharroPro debe adoptar estas reglas como contrato arquitectonico. Con gobierno de datos desde el inicio, el sistema podra crecer hacia historicos, estadisticas, IA, perfiles deportivos, ligas y federaciones sin comprometer privacidad ni confianza comercial.
