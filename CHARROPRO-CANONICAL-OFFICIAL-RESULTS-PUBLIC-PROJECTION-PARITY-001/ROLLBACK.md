# Rollback

1. Revertir el commit de este ticket mediante un commit posterior.
2. Restaurar el paquete cliente del build anterior.
3. Si Functions ya fue desplegada, desplegar nuevamente la versión anterior de `publishCharroProOfficialScore` y su trigger de fanout mediante el flujo allowlisted.
4. Verificar que el build y checksum anteriores vuelvan a estar activos.
5. Ejecutar las regresiones de official score, Terna, Public Projection, ranking y Formato Federación.

No se requiere rollback de datos ni Rules. No borrar registros oficiales, auditoría, fanout, outbox o el torneo TEST preservado.
