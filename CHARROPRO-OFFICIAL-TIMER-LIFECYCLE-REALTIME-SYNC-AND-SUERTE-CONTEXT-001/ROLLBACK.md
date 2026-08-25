# Rollback

1. Restaurar el paquete remoto previo mediante el backup inmutable generado por Terminal Deploy.
2. Revertir el commit de este ticket con un commit inverso normal; no reescribir historia.
3. Verificar que `officialTimers` permanezca intacto: el correctivo no migra ni elimina registros.
4. Confirmar que Scorer y Timer Display vuelven a consumir el contrato anterior.

No se requiere rollback de RTDB Rules ni Functions porque este ticket no las modifica ni despliega.
