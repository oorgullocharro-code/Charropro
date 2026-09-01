# Rollback

Checkpoint anterior:
`76d27d00bfe1455614fbbb289e42eed9ef3cdc12`.

El rollback productivo debe restaurar como unidad:

1. las RTDB Rules del checkpoint;
2. el backup del cliente inmediatamente anterior;
3. verificar build/checksum por HTTP;
4. confirmar que las proyecciones vuelven a usar el contrato anterior.

No se requiere rollback de Functions, perfiles, scoring ni datos deportivos.
