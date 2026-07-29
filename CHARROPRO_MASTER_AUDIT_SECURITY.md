# CharroPro Master Audit - Seguridad

## Resumen

La postura de seguridad tiene buenas bases: denegación por defecto en la raíz, Firebase Auth, perfiles activos, esquemas públicos y sanitización fuerte en Broadcast. Los principales riesgos están en autorización demasiado amplia, mutabilidad de auditoría, exposición de `live`, exportación de datos y ausencia de aislamiento multi-organización.

No se confirmó una clave privada dentro del repositorio. La API key cliente de Firebase es pública por diseño y debe protegerse mediante reglas/App Check/cuotas, no mediante secreto.

## Hallazgos

| ID | Severidad | Hallazgo | Evidencia | Impacto |
| --- | --- | --- | --- | --- |
| SEC-001 | Crítico | Auditoría de scores sobrescribible | Regla de `$recordId` exige `newData.exists()` pero no `!data.exists()` | Repudio/manipulación de historial |
| SEC-002 | Alto | Lectura pública de todo `live/{tournamentId}` | `.read: true` en reglas | Exposición de datos operativos y bypass de frontera V2 |
| SEC-003 | Alto | Escritura privada con validación estructural insuficiente | `scores`, `publishedScores`, `history`, `meta` solo restringen rol | Payload válido por permiso, no por schema |
| SEC-004 | Alto | `tournamentAccess=all` como default | `roles.js` normaliza todo lo no `selected` a `all` | Acceso transversal incompatible con SaaS |
| SEC-005 | Alto | Sin aislamiento organization/tenant en core | Rutas por tournamentId y perfil global | Mezcla entre clientes futuros |
| SEC-006 | Alto | Un juez puede escribir todo `meta` del torneo | Regla de `tournaments/{id}/meta` | Manipulación de versión/contexto/estado |
| SEC-007 | Medio/alto | Juez puede publicar cualquier proyección pública V2 válida | Regla `publicTournaments` permite juez | Integridad pública depende del cliente |
| SEC-008 | Medio | Exportación Recovery tratada como READ_ACTION | `create-full-backup` aparece antes del capability check | Rol de lectura puede exportar datos disponibles |
| SEC-009 | Medio | Backup JSON sin cifrado/firma | Descarga incluye usuarios/email/roles si están cargados | Fuga por archivo local |
| SEC-010 | Medio | URLs temporales Broadcast son bearer capabilities | Access ID/TTL/revocation | Fuga por historial/referrer/logs |
| SEC-011 | Medio | Helpers HTML internos son unsafe-by-default | `html()`/modal/innerHTML + escape manual | Riesgo XSS en futuras interpolaciones |
| SEC-012 | Medio | Dependencias Functions vulnerables | npm audit: 1 low, 9 moderate | Riesgo supply-chain/runtime |
| SEC-013 | Medio | Dependencias directas declaradas `latest` | `functions/package.json` | Builds no reproducibles |
| SEC-014 | Medio | Sin App Check/abuse controls evidentes | No encontrado en configuración auditada | Uso automatizado/costos |
| SEC-015 | Bajo/medio | Logs amplios de diagnóstico | `console.*` en publicación/Broadcast | Exposición operacional en dispositivos |

## Reglas y autorización

### Lo que sí está protegido

- Root de `charropro` no permite read/write global.
- Perfiles requieren Auth.
- Alta/edición de usuarios exige supervisor en callable.
- `publicTournaments` valida schema V2 y allowlists.
- Broadcast separa visibilidad public/production/operational/restricted.
- Contexto de sesión Broadcast restringe torneo/competencia/sesión.

### Lo que depende de UI

- `canUseAction` protege acciones visuales, pero no sustituye reglas.
- Algunas acciones etiquetadas como READ se autorizan antes de revisar capability.
- Los botones ocultos no reducen el acceso directo a RTDB.
- La granularidad por módulo no está reflejada completamente en reglas.

### Matriz resumida

| Rol | Lectura privada | Escritura principal | Riesgo |
| --- | --- | --- | --- |
| supervisor | Amplia | Amplia/delete | Necesita MFA/auditoría/session controls |
| operador | Amplia en torneos autorizados | info, teams, charreadas, scores, settings, etc. | Default all |
| juez | Torneo completo autorizado | scores, publishedScores, history, meta, live, público | Más amplio que calificar |
| locutor | Lectura según acceso | Poca/ninguna en core | `live` es público de todas formas |
| graficos | Lectura + Broadcast | graphics/Broadcast | Tenant fijo |
| organizador | Lectura/acciones UI | Capabilities parciales | Backup tratado como lectura |
| lectura | Lectura/UI | Sin write esperado | Puede ejecutar exportaciones locales |

## XSS e inyección

### Portal público

- Predomina creación DOM y `textContent`.
- Consume snapshot sanitizado V2.
- No se confirmó un vector XSS explotable en la revisión.

### App interna

- Hay múltiples `innerHTML`.
- Existe `escapeHTML` y se usa en muchos paths.
- El helper `html` no escapa automáticamente.
- Un nuevo campo interpolado sin revisión puede abrir XSS.

Recomendación: pasar a builders DOM/templating con escape por defecto y permitir HTML solo mediante APIs explícitas sanitizadas.

## URLs y Broadcast

Los módulos Broadcast bloquean `javascript:`, `file:`, `data:text/html`, secretos y signed URLs en snapshots. Esta es una fortaleza. El acceso temporal:

- usa un identificador seguro;
- expira/revoca;
- es read-only por diseño;
- debe acompañarse de `Referrer-Policy: no-referrer`, URL cleanup, TTL corto y rotación.

## Privacidad

Datos potencialmente personales:

- nombre/email/rol de usuario;
- asociaciones;
- nombres de participantes/caballos;
- actor de publicación;
- diagnósticos;
- backups.

No hay:

- clasificación aplicada técnicamente por campo;
- consentimiento/rectificación implementados;
- retención automatizada;
- tenant boundary;
- export/delete por sujeto;
- cifrado de backup descargado.

`ARCH_DATA_GOVERNANCE.md` define lineamientos, pero no es enforcement.

## Auditoría y no repudio

La auditoría actual:

- se escribe junto al score privado;
- conserva actor/datos compactos;
- puede ser leída por roles operativos;
- puede sobrescribirse;
- se elimina al borrar torneo;
- no tiene hash, secuencia server-side ni retención protegida.

No cumple todavía como evidencia robusta.

## Dependencias

`npm audit --omit=dev --json` en `functions` reportó:

- 10 vulnerabilidades;
- 1 low;
- 9 moderate;
- 0 high;
- 0 critical.

El árbol incluye `firebase-admin` 13.10.0 con actualización propuesta a 14.2.0. La actualización debe hacerse en ticket separado con emulator/tests, no durante la auditoría.

## Clasificación de riesgo

### Crítico

- Auditoría mutable.
- Ausencia de aislamiento/ledger frente a publicación concurrente se trata en integridad, y también habilita repudio.

### Alto

- `live` público.
- Reglas privadas laxas.
- juez con meta/publicación amplia.
- acceso global por default.
- ausencia tenant.

### Medio

- backup exportable/sin cifrar;
- XSS sistémico potencial;
- bearer links;
- dependencias;
- logs/App Check.

## Recomendaciones

1. Hacer auditoría append-only con escritura server-side o regla `!data.exists()`.
2. Crear esquema privado por ruta y tests Emulator.
3. Reducir juez a paths/fields estrictamente necesarios.
4. Migrar consumidores V1 y cerrar `live` público.
5. Cambiar default a acceso explícito.
6. Introducir tenant/org antes de segundo cliente.
7. Separar export de READ y auditar downloads.
8. Cifrar/firmar backups y definir retención.
9. Adoptar escape por defecto.
10. Fijar dependencias y resolver npm audit.
11. Añadir App Check/rate limits/monitoring donde aplique.
12. Políticas de seguridad, incident response y threat model por release.

## Preparación comercial de seguridad

**No lista.** El producto necesita resolver los P0/P1, demostrar reglas con Emulator, establecer aislamiento tenant y probar restauración/auditoría antes de manejar clientes independientes.
