# Rollback

Client rollback restores the complete pre-deploy `public_html/charropro` backup. It never rewrites official scores, Attempt V2, Rule Profile data, Functions or RTDB Rules.

Rollback is mandatory only for a critical client regression: app/login/scorer failure, Formato Federacion unavailable, missing institutional assets, or inconsistent build. A minor judge observation is recorded in `CERTIFIED_JUDGE_REVIEW.md` and does not trigger automatic rollback.
