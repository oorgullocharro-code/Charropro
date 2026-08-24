# Commercial Readiness Technical Risks

## Real charreada and availability
Mixed cache generations and broad app/Firebase/CSS change surfaces are the main release risks. Node 20 lifecycle is a near-term deployment risk.

## Result accuracy
No current scoring defect was found. Official Score, Attempt V2, Rule Profile and Official Format are protected and unchanged; future consolidation around them needs separate characterization-first tickets.

## Recovery
Backup/Restore and Projection Outbox are active tested authorities, not dead code.

## Security
Firebase exports and Rules cannot be judged by local imports alone. Dependency policy merits a supply-chain review.

## Maintenance-only / can wait
Documentation indexing, local artifact hygiene and cosmetic CSS consolidation can wait. Cache authority and runtime migration should not.
