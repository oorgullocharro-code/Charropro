# Legacy Portal Reference Inventory

## Audit scope

The audit searched tracked references to `torneo-publico.html` before retirement.

## Classification

| Classification | References | Disposition |
| --- | --- | --- |
| ACTIVE_RUNTIME | `torneo-publico.html` and its former V1 entrypoint | Retired to a Portal V2 compatibility redirect. |
| NAVIGATION | `js/app.js` former public URL helper | Replaced with the Portal V2 public URL helper. |
| LEGACY_COMPATIBILITY | `scripts/hostinger/deploy-client.sh`, `scripts/hostinger/smoke-client.sh` | Retained only to verify that the compatibility endpoint remains available. |
| TEST | `tests/public-portal-*.test.mjs`, `tests/public-snapshot-cache-coherence.test.mjs` | Retained or updated as legacy-contract coverage; they no longer assert that the V1 entrypoint is live. |
| DOCUMENTATION | Historical ticket evidence, repository audits, and deployment history | Preserved as immutable historical evidence. |
| DEAD_REFERENCE | `js/views/torneo-publico.js` and `js/publicPortal/*` are no longer reachable from an HTML entrypoint | Retained physically for the later commercial legacy-cleanup ticket; no internal runtime route invokes them. |

## Redirect contract

`torneo-publico.html` redirects once to `portal-v2.html`. It canonicalizes a safe tournament alias to `tournamentId` and carries only Portal V2 public route parameters: `view`, `competition`, and `phase`.

It drops build, operator, roster, score, and legacy-private query parameters. A URL without a valid tournament id lands on Portal V2's existing safe missing-tournament state.
