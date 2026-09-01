# Decision de deploy

## Superficies modificadas

- Cliente/proyeccion: SI.
- RTDB Rules: SI, solo contrato estricto de `publicTournaments/rankings`.
- Functions: NO.
- Nuevas Functions: 0.

La regla productiva vigente exige `rankings.status = unavailable`. Publicar el
cliente sin la nueva validacion haria fallar la escritura completa de la
proyeccion V2. Por ello cliente y RTDB Rules forman una sola unidad de release.

## Estado

El commit, push y paquete inmutable pueden prepararse. El deploy debe detenerse
hasta recibir autorizacion expresa para el target exacto `database`; despues se
desplegara el cliente mediante Terminal. No se usara `firebase deploy` general y
no se desplegara ninguna Function.
