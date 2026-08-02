# Modelo de Ambientes

El selector es controlado por hostname. `localhost`, `127.0.0.1`, `::1` y `[::1]` activan exclusivamente `LOCAL / EMULATOR`. Un parámetro `charroproEnv` distinto de `local`, o `local` fuera de loopback, se bloquea.

| Ambiente | Implementación en este ticket | Proyecto |
| --- | --- | --- |
| LOCAL | Sí | `demo-charropro-local` |
| STAGING | No | Sin cambios |
| PRODUCTION | Sin cambios | `charropro-e8a68` |

No existe un selector visual para Producción ni un fallback de LOCAL a Producción.
