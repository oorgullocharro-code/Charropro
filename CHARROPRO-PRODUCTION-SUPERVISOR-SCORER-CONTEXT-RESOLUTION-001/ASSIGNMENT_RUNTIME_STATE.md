# Assignment Runtime State

| Estado | Significado | Scorer |
| --- | --- | --- |
| `LOADING_CONTEXT` | Hidratacion remota incompleta | Bloqueado con espera |
| `PROFILE_ASSIGNMENT_REQUIRED` | Politica Libre sin assignment | Bloqueado y explicado |
| `PROFILE_ASSIGNMENT_PENDING` | Callable en curso | Bloqueado, sin falso vacio |
| `PROFILE_ASSIGNMENT_ERROR` | Callable rechazo o fallo | Bloqueado con razon segura |
| `PROFILE_ASSIGNMENT_INVALID` | Identidad/revision/fingerprint incoherentes | Bloqueado |
| `PROFILE_RESOLUTION_ERROR` | Perfil no resoluble | Bloqueado |
| `UNSUPPORTED_COMPETITION` | Competencia sin secuencia compatible | `Sin suertes calificables` |
| `NO_SCORING_SUERTES` | Perfil resuelto con catalogo inesperadamente vacio | Error de catalogo |
| `PROFILE_RESOLVED` | Assignment y catalogo coherentes | Habilitado |

El estado runtime de pending/error vive en memoria de la pestaña y nunca sustituye el assignment persistido.
