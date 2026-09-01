# Physical Validation Matrix

| ID | Module | Case | Expected | Method | Result | Evidence | Issue found | Severity |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| HP-003 | Portal Publico | Populated tournament, official result, partial total, reload | Correct local tournament and no duplicated teams | Auth Emulator fixture and browser | PASS desktop/reload | Cala 20 appears once for Charros Demo del Norte; partial total is 20; console errors 0 | No | - |
| HP-006 | Scorer | Representative judge workflow | Brake Review to Cala, score, publish, Save and Next | Auth Emulator fixture and browser | PASS representative flow | E1 -> E2 -> E3 Brake Review; protocol; Cala READY; 20; save advances to Rancheros de Ensayo | No | - |
| HP-007 | Scorer UX | Desktop, tablet, mobile/iPad ergonomics | No broken layout or inaccessible controls | Browser viewport plus physical devices | INCONCLUSIVE | Browser viewport override retained 1600px metrics; it cannot certify tablet/mobile | Physical device validation remains | ENVIRONMENTAL |
| HP-010 | Outputs | Active/realtime/stale/isolation | Current outputs render official local state | Timer pages with the fixture | PASS scoped | Field timer and transmission timer load `02:00.0` READY with identity. Program Main and Announcer Monitor are superseded and excluded from Commercial 1.0 validation. | No | - |
| HP-013 | Supervisor | Non-destructive operational walkthrough | Access, tournament, teams, program, navigation | Local Supervisor browser session | PASS scoped | Dashboard reports 1 tournament, 3 teams, 1 charreada; team and program views load with console errors 0 | No | - |

## Other Evidence

- Pre-Cala: every team was authorized once. The resulting sequence was
  `Brake Review -> protocolo previo -> llamada de jueces -> Cala Ready -> Cala`.
- Cala did not start automatically. It reached `READY` with `02:00.0`.
- One local only score of 20 was saved for Charros Demo del Norte. Save and
  Next advanced once to Rancheros de Ensayo and the local public Portal showed
  the same score and partial position.
- `program-main-output.html` and `announcer-monitor.html` are superseded
  Broadcast outputs, not Commercial 1.0 requirements. No composition or
  session is needed for this fixture validation.

## Classification Summary

- PASS: HP-003 desktop/reload, HP-006 representative flow, HP-013 scoped
  Supervisor flow, and the independent timer outputs within HP-010.
- PENDING: HP-007 physical device validation and the remaining representative
  sporting flow through the product's current suertes.
- New P0 findings: `0`.
- New P1 findings: `0`; pending items are historical physical gates.
- Production writes: `0`.
