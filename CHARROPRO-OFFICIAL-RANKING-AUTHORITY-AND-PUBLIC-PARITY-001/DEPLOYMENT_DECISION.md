# Decision de deploy

## Superficies modificadas

- Cliente/proyeccion: SI.
- RTDB Rules: SI, solo contrato estricto de `publicTournaments/rankings`.
- Functions: NO.
- Nuevas Functions: 0.

La regla productiva vigente exige `rankings.status = unavailable`. Publicar el
cliente sin la nueva validacion haria fallar la escritura completa de la
proyeccion V2. Por ello cliente y RTDB Rules forman una sola unidad de release.

## Recuperacion de compatibilidad

Las Rules certificadas ya estan desplegadas y no requieren cambio. El correctivo
de lectura legacy es client-only: nuevo build, paquete inmutable y deploy por
Terminal. No se repetira deploy de Rules ni se desplegara ninguna Function.
