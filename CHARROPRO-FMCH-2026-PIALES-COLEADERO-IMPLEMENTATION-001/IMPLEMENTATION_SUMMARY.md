# CHARROPRO-FMCH-2026-PIALES-COLEADERO-IMPLEMENTATION-001

## Resultado

- Base: `3884f87a80ab554987e7eec3686008fba27c04cb`.
- Implementacion tecnica Piales: PASS.
- Certificacion deportiva Piales: PASS con la fuente aprobada del programa FMCH 2026.
- Implementacion tecnica Coleadero: PASS.
- Certificacion deportiva Coleadero: BLOCKED solo para la equivalencia documental de la cuarta fila.
- Perfil: `FMCH_2026_LIBRE` version `0.3.0`, estado `draft`.
- Activacion en Produccion: NO.
- Recalculo historico: NO.

## Arquitectura reutilizada

La solucion extiende Rule Profile Engine y Attempt V2. No crea motores, stores ni scorers paralelos. El catalogo nuevo vive en `js/data/fmch2026PialesColeaderoRules.js`; `js/data/ruleProfiles.js` lo aplica solamente al perfil FMCH 2026. Product Base permanece disponible para torneos e historicos legacy.

El flujo operativo conserva botonera, manuales, evidencia, nota, Descalificacion, Marcar 0, footer y publicacion oficial existente. El pipeline de publicacion no fue modificado.

## Piales

- Tres oportunidades.
- Ocho bases como botones: 14, 18, 20, 22, 24, 26, 28 y 30.
- Distancia capturada como valor numerico y congelada como cantidad de la regla oficial.
- Verijas bloquea adicionales.
- Historial de identidad de remate en las tres oportunidades.
- Descalificacion automatica reversible para tercer remate repetido cuando los dos primeros remates validos son iguales.
- Trece infracciones individuales, una infraccion de equipo y diecisiete causas de Descalificacion.
- Adicionales e infracciones manuales preservados.

## Coleadero

- Tres coleadores por tres oportunidades.
- Nueve caidas oficiales como botones.
- Los nombres reales del roster sustituyen etiquetas genericas cuando existen.
- Distancias mutuamente exclusivas, Lola y Sin apretador.
- Veintitres infracciones individuales, dos de equipo y quince causas de Descalificacion.
- Las infracciones confirmadas que anulan base aplican la condicion sin borrar selecciones ni puntos malos.
- El contrato acepta un diagrama oficial opcional y suprime iconografia generica. No se invento un asset porque la fuente aprobada no entrega uno.

## Compatibilidad

- Cala conserva catalogo, Punta, DQ y Attempt V2.
- Toro, Terna, Yegua, Manganas y Paso no cambian deportivamente.
- Los historicos no se recalculan.
- Los catalogos Product Base de Piales y Colas no se modifican fisicamente.
- Cache-buster final unico: `20260808-fmch-2026-piales-coleadero-001-v1`.

## Seguridad operativa

La evidencia visual uso exclusivamente `demo-charropro-local` en `127.0.0.1:9000`. El fixture rechaza hosts no loopback y no contiene dominios, credenciales ni identificadores de Produccion. No se publico score, no hubo deploy y no hubo push.
