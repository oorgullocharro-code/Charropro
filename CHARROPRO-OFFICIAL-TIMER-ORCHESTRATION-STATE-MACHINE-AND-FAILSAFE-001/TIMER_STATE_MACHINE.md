# Timer State Machine

Transiciones validas:

- `READY -> RUNNING` mediante START.
- `RUNNING -> PAUSED` mediante PAUSE.
- `PAUSED -> RUNNING` mediante RESUME.
- `RUNNING -> FINISHED` mediante FINISH.
- `PAUSED -> FINISHED` mediante FINISH.

START/FINISH son acciones primarias. PAUSE/RESUME son acciones secundarias. Un timer FINISHED no vuelve a iniciar. CAS, controller ownership e idempotency permanecen en Timer Authority.

Una fase FINISHED puede habilitar la siguiente definicion temporal en READY, pero nunca hereda anclas ni elapsed del timer anterior.
