# Firebase Local Audit

- RTDB Rules: firebase-rules-auditoria.json
- Storage Rules: storage.rules
- Functions source: functions/
- Emulator ports: Auth 9099, RTDB 9000, Functions 5001, Storage 9199
- Network writes/deploys: none

## Exported surfaces

- upsertCharroProUser: ACTIVE_PROBABLE; external consumers may not appear locally
- publishCharroProOfficialScore: ACTIVE_PROBABLE; external consumers may not appear locally
- deliverCharroProOfficialScoreFanout: ACTIVE_PROBABLE; external consumers may not appear locally
- requestCharroProBackup: ACTIVE_PROBABLE; external consumers may not appear locally
- cancelCharroProBackup: ACTIVE_PROBABLE; external consumers may not appear locally
- executeCharroProBackup: ACTIVE_PROBABLE; external consumers may not appear locally
- scheduleCharroProBackups: ACTIVE_PROBABLE; external consumers may not appear locally
- validateCharroProRestore: ACTIVE_PROBABLE; external consumers may not appear locally
- requestCharroProRestore: ACTIVE_PROBABLE; external consumers may not appear locally
- cancelCharroProRestore: ACTIVE_PROBABLE; external consumers may not appear locally
- executeCharroProRestore: ACTIVE_PROBABLE; external consumers may not appear locally
- getCharroProConfiguration: ACTIVE_PROBABLE; external consumers may not appear locally
- publishCharroProConfiguration: ACTIVE_PROBABLE; external consumers may not appear locally
- transitionCharroProRuleProfileLifecycle: ACTIVE_PROBABLE; external consumers may not appear locally
- getCharroProRuleProfileLifecycle: ACTIVE_PROBABLE; external consumers may not appear locally
- assignCharroProTournamentRuleProfile: ACTIVE_PROBABLE; external consumers may not appear locally

functions/node_modules and .local Emulator state are ignored generated/local artifacts. No Function is marked DELETE.
