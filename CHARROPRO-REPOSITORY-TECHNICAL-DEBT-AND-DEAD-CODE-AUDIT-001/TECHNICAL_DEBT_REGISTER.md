# Technical Debt Register

## TD-001 — P1 HIGH
- Area: Client
- Description: js/app.js is 643,875 bytes and spans UI, orchestration, lifecycle and scorer flows.
- Evidence: repository inventory/dependency graph
- Risk: maintainability, release consistency or future supportability according to severity
- Recommended action: Extract bounded non-sporting domains with characterization tests.
- Requires behavior change: false
- Requires migration: false
- Requires Firebase change: false
- Requires deploy: true
- Suggested ticket: CHARROPRO-APP-MONOLITH-BOUNDARY-EXTRACTION-001

## TD-002 — P1 HIGH
- Area: Cache
- Description: Current runtime mixes the August build with July cache-busters.
- Evidence: repository inventory/dependency graph
- Risk: maintainability, release consistency or future supportability according to severity
- Recommended action: Introduce one generated asset-version authority.
- Requires behavior change: false
- Requires migration: true
- Requires Firebase change: false
- Requires deploy: true
- Suggested ticket: CHARROPRO-CACHE-BUSTER-SINGLE-AUTHORITY-001

## TD-003 — P1 HIGH
- Area: Functions
- Description: functions/package.json targets Node 20.
- Evidence: repository inventory/dependency graph
- Risk: maintainability, release consistency or future supportability according to severity
- Recommended action: Dedicated supported-runtime migration with Emulator/canary.
- Requires behavior change: false
- Requires migration: true
- Requires Firebase change: true
- Requires deploy: true
- Suggested ticket: CHARROPRO-NODE-20-RUNTIME-MIGRATION-001

## TD-004 — P2 MEDIUM
- Area: CSS
- Description: styles.css is 232,842 bytes and crosses product surfaces.
- Evidence: repository inventory/dependency graph
- Risk: maintainability, release consistency or future supportability according to severity
- Recommended action: Map selector ownership; extract one surface at a time.
- Requires behavior change: false
- Requires migration: true
- Requires Firebase change: false
- Requires deploy: true
- Suggested ticket: CHARROPRO-CSS-OWNERSHIP-BOUNDARIES-001

## TD-005 — P2 MEDIUM
- Area: Firebase
- Description: firebaseSync.js is 246,152 bytes and spans multiple data domains.
- Evidence: repository inventory/dependency graph
- Risk: maintainability, release consistency or future supportability according to severity
- Recommended action: Characterize then separate adapters without path changes.
- Requires behavior change: false
- Requires migration: true
- Requires Firebase change: false
- Requires deploy: true
- Suggested ticket: CHARROPRO-FIREBASE-CLIENT-ADAPTER-BOUNDARIES-001

## TD-006 — P2 MEDIUM
- Area: Docs
- Description: 26 historical docs contain status language easily mistaken for current authority.
- Evidence: repository inventory/dependency graph
- Risk: maintainability, release consistency or future supportability according to severity
- Recommended action: Create immutable historical/current authority index.
- Requires behavior change: false
- Requires migration: false
- Requires Firebase change: false
- Requires deploy: false
- Suggested ticket: CHARROPRO-DOCUMENTATION-AUTHORITY-INDEX-001

## TD-007 — P2 MEDIUM
- Area: Dependencies
- Description: firebase-admin/functions are declared as latest despite lockfile.
- Evidence: repository inventory/dependency graph
- Risk: maintainability, release consistency or future supportability according to severity
- Recommended action: Pin reviewed ranges in dedicated dependency ticket.
- Requires behavior change: false
- Requires migration: true
- Requires Firebase change: false
- Requires deploy: true
- Suggested ticket: CHARROPRO-FUNCTIONS-DEPENDENCY-PINNING-001

## TD-008 — P2 MEDIUM
- Area: Unknown code
- Description: 1 JS modules need runtime/external-consumer tracing; HIGH dead=0.
- Evidence: repository inventory/dependency graph
- Risk: maintainability, release consistency or future supportability according to severity
- Recommended action: Trace usage before any deletion.
- Requires behavior change: false
- Requires migration: false
- Requires Firebase change: false
- Requires deploy: false
- Suggested ticket: CHARROPRO-DEAD-CODE-RUNTIME-TRACE-001

## TD-009 — P3 LOW
- Area: Local hygiene
- Description: Ignored .DS_Store, logs, PID and Emulator export exist locally.
- Evidence: repository inventory/dependency graph
- Risk: maintainability, release consistency or future supportability according to severity
- Recommended action: Package exclusions and optional local cleanup guide.
- Requires behavior change: false
- Requires migration: false
- Requires Firebase change: false
- Requires deploy: false
- Suggested ticket: CHARROPRO-LOCAL-ARTIFACT-HYGIENE-001

## TD-010 — P3 LOW
- Area: Evidence
- Description: Certification evidence/documentation dominates repository navigation.
- Evidence: repository inventory/dependency graph
- Risk: maintainability, release consistency or future supportability according to severity
- Recommended action: Retention policy and authority indexes; do not delete evidence.
- Requires behavior change: false
- Requires migration: true
- Requires Firebase change: false
- Requires deploy: false
- Suggested ticket: CHARROPRO-CERTIFICATION-EVIDENCE-RETENTION-001
