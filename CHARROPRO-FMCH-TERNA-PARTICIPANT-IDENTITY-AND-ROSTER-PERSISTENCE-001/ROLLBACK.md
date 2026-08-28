# Rollback

## Cliente

El deploy por Terminal crea un ZIP remoto previo a reemplazar el cliente. El
rollback permitido restaura ese backup completo y vuelve a ejecutar smoke HTTP.

Antes del deploy se exige `rollback-client.sh --dry-run` contra el backup
generado por la misma operacion.

## Datos y backend

No hay migracion de datos, cambio de RTDB Rules, deploy de Functions ni
escritura lifecycle. El rollback no requiere reinterpretar scores ni modificar
`FMCH_2026_LIBRE 0.6.1`.
