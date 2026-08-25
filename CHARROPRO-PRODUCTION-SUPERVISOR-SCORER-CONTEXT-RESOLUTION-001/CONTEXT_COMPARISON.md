# Context Comparison

| Campo | Local | Emulator | Production desktop | Production iPad Supervisor |
| --- | --- | --- | --- | --- |
| Assignment | Fixture explicito permitido | Fixture sintetico | Canonico requerido | Canonico requerido |
| Source | `local-emulator` | `local-emulator` | `productive-default` o `explicit` | `productive-default` o `explicit` |
| Profile | FMCH fixture activo | FMCH fixture activo | Assignment activo | Assignment activo requerido |
| Suertes | 10 esperadas | 10 verificadas por tests | 10 tras assignment | Pendiente validacion fisica post-deploy |
| Cache | Build local | Build local | Build canonico | Build canonico WebKit |

La evidencia read-only previa encontro torneos productivos asignados y torneos Libre sin assignment. `Casa loma` fue observado sin assignment y sin scores. Este ticket no lo modifica: cualquier reparacion productiva exige un gate separado de escritura.
