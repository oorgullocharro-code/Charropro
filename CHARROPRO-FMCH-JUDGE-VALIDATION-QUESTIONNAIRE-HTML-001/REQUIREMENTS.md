# Requisitos implementados

| Requisito | Implementación |
| --- | --- |
| Uso sin conexión | Archivos estáticos locales sin `fetch`, API ni CDN. |
| Lenguaje para jueces | Preguntas en español deportivo; términos técnicos ocultos. |
| Hoja por sección | Recortes PNG directos del PDF oficial y vista completa con zoom. |
| Entrevistador y autónomo | El flujo de entrevistador es principal; cualquier juez puede responder directamente. |
| Autosave y continuidad | `localStorage`, identificador único, guardado por respuesta y lista de entrevistas. |
| Múltiples entrevistas | Cada registro conserva su propio `interviewId`; importar no sobrescribe un ID existente. |
| Exportación | JSON, CSV e impresión nativa para guardar como PDF. |
| Revisión posterior | Estados de respuesta sin conversión automática a regla. |
| Seguridad | Sin red, Firebase, adjuntos binarios, secretos ni datos productivos. |
