# Targeted Deployment Plan

This change requires four explicit targets and no general Firebase deploy:

1. Client package, for the Supervisor editorial surface and Portal sponsor visibility.
2. `functions:uploadCharroProTournamentPublicAsset`, as an allowed initial create under Node 22.
3. RTDB Rules, for the explicit editorial metadata branches.
4. Storage Rules, for public read-only editorial objects while preserving direct client write denial.

Before deployment, verify the Functions inventory contains the existing eleven allowed functions and only proposes the single authorized create. Do not deploy unrelated Functions, do not deploy a general `--only functions`, and do not change sporting, lifecycle, ranking, or score data.

After deployment, use a disposable TEST tournament through the Supervisor UI to upload a cover, logo, and sponsor assets; change the sponsor order; disable a sponsor; and remove the cover. Confirm V3 and Portal V2 update naturally. No production sporting write is required.
