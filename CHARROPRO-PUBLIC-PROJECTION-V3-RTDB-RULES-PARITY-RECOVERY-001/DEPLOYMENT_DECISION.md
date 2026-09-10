# Deployment Decision

## Authorized Target

Only RTDB Rules are eligible for deployment after commit and push. No client, Hosting, Function, IAM, score, or data deployment is part of this change.

## Integrity

| Artifact | SHA-256 |
| --- | --- |
| Previously committed Rules | `97805aaf18f2af97539842478a36b7e424ca361c3287a03f9f25bf908bb5c722` |
| V3 parity Rules | `fd390c5992a60ad3b2d35a3d20d76f01837ea03eb765badf498c38809c8d9d6e` |

Rollback is the previous Rules artifact checksum above and the parent commit of the Rules parity commit.

## Post-deploy Stop Gate

After RTDB Rules deployment and remote artifact verification, stop. Do not retry the three Dead Letter jobs until the user explicitly authorizes a controlled retry limited to `torneo_mtut0u78_ojpwf6`.
