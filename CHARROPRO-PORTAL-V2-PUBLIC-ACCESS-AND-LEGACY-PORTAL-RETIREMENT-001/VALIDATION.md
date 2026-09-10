# Validation

## Directed coverage

- Canonical Portal V2 public URL and copied absolute URL.
- Tournament A and Tournament B isolation.
- Dashboard and tournament-list public actions.
- Legacy URL to Portal V2 redirect, safe missing-id behavior, and no redirect loop.
- Portal V2 direct deep link and existing navigation views.
- Legacy compatibility endpoint and cache-coherence smoke contracts.

## Completed gates

- Directed public-access, Portal V2, legacy compatibility, and cache tests: PASS.
- Full suite: `314 PASS`, `1 SKIP`, `0 FAIL`.
- Node syntax: `352/352 PASS`.
- JSON validation: `32/32 PASS`.
- `git diff --check`: PASS.
- `git diff --cached --check`: PASS before staging.
- Secret scan: PASS.
- Debugger scan: PASS.
- Build propagator: idempotent with no residual changes.

## Deployment scope

- Client: required.
- Functions: not changed.
- RTDB Rules: not changed.
- Production data writes: 0.
