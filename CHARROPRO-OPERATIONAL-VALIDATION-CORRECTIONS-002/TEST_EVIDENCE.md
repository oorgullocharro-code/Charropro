# Test Evidence

## Pruebas dirigidas

- Pending same-client create/open: PASS.
- Pending same-client update/open: PASS.
- Pending snapshot vacío o atrasado: PASS.
- Pending cross-client conflict y sync: PASS.
- Coleadero 3 equipos x 3 coleadores: PASS.
- Líder en equipos 1, 2 y 3: PASS.
- Identidad y empate explícito: PASS.
- Matriz de Terna A-G: PASS.
- Transición SUCCESS desde selección base canónica de Attempt V2: PASS automatizado.
- Cabecero SUCCESS + Pial SUCCESS -> `COMPLETED` en 2/5: PASS automatizado.
- Cabecero FAIL + Cabecero SUCCESS + Pial SUCCESS -> `COMPLETED` en 3/5: PASS automatizado.
- Cabecero SUCCESS + Pial FAIL + Pial SUCCESS -> `COMPLETED` en 3/5: PASS automatizado.
- Cabecero SUCCESS + Pial FAIL -> continúa Pial en O3: PASS automatizado.
- No reserva posterior, `CLOSED_UNUSED`, referencias de score y timer compartido: PASS automatizado.
- Adaptador real del scorer legacy → Attempt V2 → Cabecero completado: PASS.
- Pool, `CLOSED_UNUSED` y timer compartido: PASS.
- Layout de Paso y reflow: PASS.

## Validación visual

CharroPro se abrió en `LOCAL / EMULATOR` con el torneo sintético. Paso conservó todos sus controles, no presentó traslapes ni overflow horizontal en los viewports operativos.

La corrección final de Terna se recorrió en el cliente real contra Emulator:

1. Cabecero `Sencillo` -> CTA `Guardar -> Pial en el Ruedo`.
2. Publicación local -> Pial en el Ruedo, oportunidad 2/5.
3. Pial `Sencillo` -> CTA `Guardar -> Finalizar Terna`.
4. Publicación local -> avance canónico a Jineteo de Toro del siguiente equipo.
5. No apareció oportunidad 3 y el total del equipo conservó los dos scores.

La página confirmó `LOCAL / EMULATOR`; no hubo deploy, push ni escritura en Firebase Production. La consola conservó avisos `permission_denied` ya conocidos para Public Projection/Outbox del fixture local, fuera del alcance de este correctivo y sin impedir la publicación oficial local ni el avance de Terna.

## Desviación manual

La apertura durable de una pendiente existente fue bloqueada por Firebase Emulator Rules (`permission_denied`). La prueba determinista de revisión/CAS pasa; no se modificaron Rules fuera del alcance.

Por ese bloqueo, el recorrido manual end-to-end de Pending no quedó aprobado. Coleadero global y la matriz de transición de Terna quedaron cubiertos de forma determinista por pruebas automatizadas, pero no se declara una validación visual completa de esos recorridos.

Las comprobaciones visuales `Cabecero válido -> Guardar -> Pial en el Ruedo` y `Cabecero SUCCESS -> Pial SUCCESS -> fin de Terna` quedaron aprobadas en el cliente real local.

## Corrida final

- `node --check`: 175/175 archivos `.js` y `.mjs` aprobados.
- Suite completa: 73/73 archivos `tests/*.test.mjs` aprobados.
- JSON: 27/27 archivos válidos.
- Configuration Management y checksum del baseline: PASS.
- `git diff --check`: PASS.
- `git diff --cached --check`: PASS; staging vacío.
- Scan de `debugger`, `console.log`, `console.debug` y `console.trace` en líneas agregadas: sin hallazgos.
- Scan de secretos en líneas agregadas: sin hallazgos.
- Cache-buster runtime nuevo: 73 archivos; identificador runtime anterior: 0 archivos.
- Dos documentos históricos conservan deliberadamente el identificador anterior.
- Firebase Rules y dependencias: sin cambios.
