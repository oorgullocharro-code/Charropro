# Pending Review Reconciliation

## Causa raíz

El listener reemplazaba el registro local completo del torneo con cualquier snapshot remoto. Un snapshot atrasado podía sustituir una revisión ya confirmada por la transacción y provocar un falso conflicto en el mismo cliente. Además, la respuesta canónica de una transacción conflictiva solo se almacenaba cuando `ok` era verdadero.

## Contrato corregido

La reconciliación compara por `pendingId` y conserva siempre la revisión mayor. Un snapshot vacío o anterior no elimina ni degrada una confirmación durable local. Una revisión remota superior sí reemplaza la local.

Flujo de creación y actualización:

1. El cliente solicita la escritura con `expectedRevision`.
2. La transacción durable aplica CAS.
3. La respuesta canónica se guarda localmente, también cuando informa un conflicto real.
4. El listener reconcilia por revisión sin retrocesos.
5. La siguiente operación usa la revisión canónica vigente.

## Protección de concurrencia

No se eliminó CAS ni se introdujeron esperas. Un cliente con revisión N continúa bloqueado si el durable ya está en N+1. Tras sincronizar N+1, la operación vuelve a ser válida.

## Validación manual local

La UI local mostró correctamente la pendiente existente, pero la transacción de apertura fue rechazada por Firebase Emulator Rules con `permission_denied`. El cliente mostró el mensaje genérico de conflicto. Esta limitación del fixture/autorización local queda registrada y no se corrigió ampliando el ticket a Rules.
