# CharroPro Master Audit - Pruebas y calidad

## Resultado ejecutivo

- 44 suites/subtests descubiertos por `node --test tests/*.test.mjs`.
- 44 pasaron.
- 0 fallaron.
- Duración observada aproximada: 2.07 s.
- Todos los archivos JavaScript rastreados pasaron `node --check`.
- `git diff --check` estaba limpio antes de crear los reportes.

El resultado es positivo para regresión local, pero la duración y estructura muestran que la mayoría de pruebas son unitarias, contractuales o estáticas. No validan por sí solas Firebase real, UI real, concurrencia o recuperación.

## Inventario por área

| Área | Tests existentes | Tipo dominante | Evaluación |
| --- | --- | --- | --- |
| Motor deportivo | cala, team penalties, tournament context | Unitario | Bueno en casos focales, insuficiente para todo el reglamento |
| Portal público | foundation, projection, client, router, selectors, UX, design | Unitario/fixture/static | Amplio por contrato |
| Live Feed | feed, templates, integration | Unitario/integration in-memory | No prueba pérdida/reparación remota |
| Firebase Rules | public/broadcast rules | Parseo/aserción estática | No ejecuta Emulator |
| Broadcast | 25+ suites de motores/salidas | Unitario/integration in-memory | Buena disciplina de contratos |
| Navigation | supervisor/production nav | Source/static | No interacción real |
| Recovery | Sin suite de restore | N/A | Ausente |
| Usuarios/Auth | Sin Emulator/callable E2E | N/A | Ausente |
| Concurrencia score | Sin dos clientes/transaction | N/A | Ausente |
| Timer authority | Sin dos controladores | N/A | Ausente |
| Performance | No encontrada | N/A | Ausente |
| Visual | Aserciones CSS/fixture, no screenshots | Static | Insuficiente |
| Accessibility | No encontrada | N/A | Ausente |
| Offline/reconnect core | Broadcast sí; core no | Unitario | Parcial |

## Archivos de prueba

La carpeta `tests` contiene suites para:

- Announcer Monitor.
- Access Hub.
- Action Engine.
- Asset Manager.
- Component Library/Renderer.
- Data Contract.
- Output/Output Routing.
- Broadcast Playground.
- Preview/Program/Projection.
- Realtime transport.
- Broadcast State/Workspace.
- Template/Theme e integraciones.
- Browser Output.
- Cala rules.
- Firebase public/Broadcast rules.
- Live Bindings.
- Output synchronization.
- Production Console/Navigation/Variables.
- Program Main Output.
- Public foundation/live feed/portal/projection.
- Supervisor navigation.
- Team penalties y tournament context.

## Confiabilidad de las pruebas

### Alta

- Funciones puras con inputs/outputs.
- Inmutabilidad/sanitización Broadcast.
- Revisión/idempotencia en motores in-memory.
- Catálogos y reglas focales.
- Validación de snapshots/proyecciones.

### Media

- Integraciones entre módulos usando fixtures.
- Simulación de realtime con adapters falsos.
- Asunciones de DOM/CSS por source.

### Baja para producción

- Reglas Firebase evaluadas como texto.
- Navegación validada mediante presencia de strings/estructura.
- Paths de publicación sin servidor/emulator.
- Responsive sin navegador/pixel check.
- Seguridad sin DAST.

La auditoría contó aproximadamente 162 lecturas/aserciones estáticas sobre source en tests. Son útiles como guard contractual, no sustituyen comportamiento.

## Vacíos críticos

1. **Score concurrency**
   - dos dispositivos publican mismo attempt;
   - expected revision;
   - supersesión única.
2. **Public projection recovery**
   - multipath privado ok;
   - proyección falla;
   - outbox/retry/reconcile.
3. **Firebase Rules Emulator**
   - matriz por rol;
   - payloads inválidos;
   - cross-tournament;
   - audit immutability.
4. **Tournament delete/restore**
   - public tombstone;
   - Broadcast cleanup;
   - access cleanup;
   - restore roundtrip.
5. **Timer authority**
   - dos controladores;
   - reconnection;
   - stale revisions.
6. **Browser E2E**
   - login;
   - crear torneo;
   - programa;
   - juez;
   - publicar;
   - portal;
   - Broadcast outputs.
7. **Visual/accessibility**
   - desktop/tablet/mobile;
   - outdoor contrast;
   - touch targets;
   - keyboard/screen reader.
8. **Performance**
   - 100 dispositivos;
   - 1,000 torneos;
   - large score history;
   - long-running Broadcast.
9. **Security**
   - XSS corpus;
   - bearer link leakage;
   - App Check/abuse;
   - dependency scanning CI.
10. **Offline**
    - close/reopen;
    - storage quota;
    - conflict/reconcile.

## Cobertura

No existe configuración de cobertura encontrada. Por ello:

- no se puede reportar porcentaje de líneas/branches;
- “44 suites pasan” no equivale a cobertura amplia;
- archivos grandes como `app.js` y `firebaseSync.js` no tienen trazabilidad suficiente por rama.

Recomendación: instrumentar cobertura y fijar umbrales inicialmente por módulos críticos, no globales arbitrarios.

## Pruebas obsoletas o legacy

- `broadcast-access-hub.test.mjs` mantiene vivo un módulo aparentemente reemplazado.
- Suites de gráficos/OBS V1 no representan el pipeline V2.
- Tests de versionado/source pueden pasar aunque el navegador cargue dos instancias por URLs distintas.
- No se confirmó una suite para Google Apps Script.

## Comandos ejecutados

```bash
node --test tests/*.test.mjs
```

Resultado: 44/44, 0 fallos.

```bash
find . -type f -name '*.js' ... node --check
```

Resultado: todos los JS rastreados válidos.

```bash
cd functions && npm audit --omit=dev --json
```

Resultado: exit 1 por 10 vulnerabilidades (1 low, 9 moderate).

```bash
git diff --check
```

Resultado previo a reportes: sin errores.

## Estrategia recomendada

### Pirámide

1. Unit tests para dominio/contratos.
2. Integration tests con repositorios/adapters reales sobre Emulator.
3. Browser E2E para journeys críticos.
4. Visual regression y accessibility.
5. Load/soak/reconnection.
6. Restore/disaster drills.

### Gates de release

- `node --check`.
- Unit/integration.
- Firebase Emulator rules.
- E2E score -> portal -> Broadcast.
- concurrency test.
- restore drill para releases de datos.
- npm audit policy.
- diff/cache-buster identity check.
- no mixed module URLs.

### Fixtures canónicos

Mantener fixtures para:

- torneo legacy;
- equipos completo;
- Charro Completo;
- Caladero/Coleadero/Pialadero;
- 3 y 4 equipos;
- score 0/negativo/null/ausente;
- corrección concurrente;
- participante/caballo sin registrar;
- internet estable/stale/offline.

## Interpretación final

La disciplina de tests Broadcast y Portal es una fortaleza. El producto obtiene 45% en testing porque los paths que pueden perder consistencia no están simulados en un backend real ni recorridos por un navegador. La prioridad no es crear más tests estáticos, sino elevar el nivel de integración y reproducibilidad.
