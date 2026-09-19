# Deployment decision

Lifecycle and proportional deployment are authorized for the locally certified
`FMCH_2026_LIBRE 0.6.2 DRAFT` artifact.

- Build: `20260919-cala-medios-lados-plus-one-controls-fix-001-v1`
- Client deploy: `YES`
- RTDB Rules deploy: `NO` (no Rules diff)
- Functions deploy: targeted only
- Production writes: canonical lifecycle transitions only

The minimum Functions target set is:

- `transitionCharroProRuleProfileLifecycle`
- `getCharroProRuleProfileLifecycle`
- `assignCharroProTournamentRuleProfile`
- `getCharroProConfiguration`
- `publishCharroProConfiguration`
- `reconcileCharroProHistoricalResults`

The first three consume the 0.6.2 lifecycle certificate, the configuration
pair must retain one baseline authority for the prospective productive default,
and reconciliation is the only production Function that directly consumes the
updated Browser/Functions rule-profile mirror. The remaining six production
Functions, including the two recovered Eventarc Functions, are outside this
deployment.

The canonical lifecycle must preserve 0.6.1 and perform only valid state-machine
transitions. No historical Attempt V2 or Official Score is reinterpreted.

Pre-deploy status: `CERTIFIED_PENDING_CANONICAL_LIFECYCLE_AND_PROPORTIONAL_DEPLOY`.
