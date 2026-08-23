# Risks

| Risk | Status | Control |
| --- | --- | --- |
| Human interpretation differs from certified mapping | OPEN | `PENDING_CERTIFIED_JUDGE_REVIEW`; observations become a separate controlled ticket |
| Historical Attempt lacks granular evidence | CONTROLLED | `UNAVAILABLE_FROM_HISTORICAL_SOURCE`; no inference |
| T confused with duration | MITIGATED | Exact Rule ID matrix and separate `officialElapsedMs` projection |
| Bad reason inferred from numeric value | MITIGATED | Code travels in frozen Rule metadata; AH/D/R tested |
| Double mapping in Jineteos | MITIGATED | Exact Rule ID mapping; double mapping count `0` |
| Double discount by Suma Control | MITIGATED | `affectsScore:false`; 5+4=9 fixture and score invariance |
| Layout clips dense official labels | MITIGATED | One-page Letter PDF visually inspected with targeted compact styles |
