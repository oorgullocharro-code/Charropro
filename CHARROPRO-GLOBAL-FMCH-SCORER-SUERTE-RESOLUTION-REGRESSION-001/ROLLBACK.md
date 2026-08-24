# Rollback

## Codigo

Revertir el commit completo del ticket mediante un commit inverso. No restaurar archivos selectivamente ni reescribir historial.

## Cliente Hostinger

Usar el backup remoto creado inmediatamente antes del deploy por `scripts/hostinger/deploy-client.sh`. Ejecutar primero el rollback dry-run y confirmar build/checksum antes de restaurar.

## Firebase

No existe rollback de Functions, RTDB Rules ni datos porque este ticket no los despliega ni escribe Produccion.

## Criterios

Aplicar rollback si el build/checksum remoto diverge, el scorer vuelve a mostrar un vacio falso, o aparece una regresion critica de carga. La validacion fisica iPad pendiente no exige rollback por si sola; exige diagnostico si difiere del smoke productivo.
