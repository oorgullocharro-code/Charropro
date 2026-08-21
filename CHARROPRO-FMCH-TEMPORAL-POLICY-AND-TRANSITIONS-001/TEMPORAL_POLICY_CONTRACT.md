# Rule Profile Temporal Policy and Transitions

## Control

- Ticket: `CHARROPRO-FMCH-TEMPORAL-POLICY-AND-TRANSITIONS-001`.
- Policy version: `1.0.0`.
- Base: `02ffb746ee940e228aef6e1166bbaa765a983fe9`.
- Scope: pure temporal policy, lifecycle state machine and deterministic resolution.
- Production activation, tournament assignment and persistence: excluded.

## Architecture found

The existing Rule Profile Engine provides:

- immutable profile definitions in versioned source code;
- exact selection by `profileId` and `version`;
- statuses `skeleton`, `draft`, `active`, `deprecated` and `archived`;
- structural validation and declarative security controls;
- Product Base compatibility for tournaments without a profile;
- explicit Product Base fallback;
- Local/Emulator-only activation of a cloned FMCH fixture.

It did not provide:

- effective date semantics;
- a `ready` state;
- lifecycle revision or CAS;
- controlled transitions;
- authoritative timestamps and actors;
- overlap/gap detection;
- temporal selection among versions;
- content freezing between readiness, activation and retirement.

## State model

The canonical lifecycle is:

```text
SKELETON -> DRAFT -> READY -> ACTIVE -> RETIRED -> ARCHIVED
                 ^       |
                 +-------+
```

`READY -> DRAFT` withdraws readiness so the definition can be corrected and
certified again. `DRAFT`, `READY` and `SKELETON` may be archived without ever
becoming effective.

`deprecated` remains supported as a legacy retirement alias:

```text
ACTIVE -> DEPRECATED -> ARCHIVED
```

There is no transition from `RETIRED`, `DEPRECATED` or `ARCHIVED` back to
`ACTIVE`. A replacement requires a new immutable version.

## Transition rules

Every transition requires:

- trusted or Local/Emulator authority;
- actor with stable `uid`;
- authoritative timestamp supplied by that authority;
- `expectedRevision` equal to the current revision;
- stable `idempotencyKey`.

The state machine never reads the browser clock. Timestamps must include `Z` or
an explicit UTC offset, or be a finite epoch value supplied by the authority.

The same idempotency key and request returns the previous result without
incrementing revision or changing timestamps. Reusing a key for a different
transition is rejected.

`DRAFT -> READY` requires:

- `activationReady === true`;
- a valid `effectiveFrom`;
- an optional valid `effectiveTo` greater than `effectiveFrom`;
- a content fingerprint frozen at the transition.

`READY -> ACTIVE` requires the frozen content to remain unchanged. Activation
records `activatedAt` and `activatedBy`.

`ACTIVE -> RETIRED` or `ACTIVE -> DEPRECATED` requires the same frozen content
and closes the effective interval. Retirement records `retiredAt` and
`retiredBy`.

## Temporal semantics

Effective intervals are half-open:

```text
[effectiveFrom, effectiveTo)
```

The start instant is included and the end instant is excluded. An absent
`effectiveTo` means that the interval is open-ended.

Resolution never uses current local time. Its evaluation anchor is selected in
this order:

1. explicit authoritative `at`;
2. `context.ruleProfileEffectiveAt`;
3. tournament `startedAt`;
4. tournament `createdAt`.

If none exists, resolution is blocked. This preserves deterministic historical
behavior and prevents a refresh in a different timezone from selecting another
version.

Automatic temporal selection returns a version only when exactly one candidate
is effective. Overlaps and gaps block resolution. Exact version requests still
must be effective at the selected instant.

The boundary contract is covered at one-millisecond precision: `effectiveFrom`
is inclusive and `effectiveTo` is exclusive. UTC (`Z`) and explicit numeric
offsets are normalized to the same canonical ISO instant. Dates without an
offset, including ambiguous local or daylight-saving clock values, fail closed.

For an existing tournament, `startedAt` takes precedence over `createdAt`. This
pins temporal resolution to the tournament start when no explicit authoritative
anchor was stored. A tournament that spans a later rules boundary does not
silently migrate because wall-clock time advances or a newer registry version is
added.

## Compatibility

- Existing Product Base behavior is unchanged.
- A tournament without a profile remains Product Base and never masquerades as
  FMCH. An invalid explicit profile may use Product Base only through the
  existing formal `ruleProfileFallback: "product_base"` path; that result is
  identified as a fallback and retains the blocking diagnostics.
- The existing exact resolver remains unchanged unless a managed temporal
  profile or explicit `evaluationAt` is supplied.
- Existing exact `active` and `deprecated` profiles without temporal metadata
  remain readable through the legacy compatibility path.
- Legacy profiles without an effective interval are not eligible for automatic
  version selection.
- Existing `deprecated` behavior remains available; new lifecycle work should
  prefer `retired`.
- Existing scores continue to use persisted totals and rulebook context. No
  historical score is recalculated.
- Existing Attempt V2 references (`ruleProfileId`, `ruleProfileVersion` and
  `effectiveRulesFingerprint`) are outside temporal resolution and remain
  unchanged.
- `FMCH_2026_LIBRE 0.6.0` remains `draft` with
  `activationReady:false` and is still blocked.

## Security

The policy module is pure and does not expose a client write path. It rejects:

- client authority;
- missing actor, revision, idempotency key or authoritative time;
- illegal jumps and reactivation;
- active content mutation;
- invalid dates, ranges and revisions;
- functions, symbols, BigInt and non-finite numbers;
- cycles, accessors and custom prototypes;
- `__proto__`, `constructor` and `prototype`;
- excessive depth, arrays, object keys and strings.

Inputs are cloned and transitions are atomic. Failed transitions leave the
source untouched. Audit events contain before/after lifecycle summaries, actor,
authority, revision and timestamp.

The content fingerprint detects lifecycle mutation but is not an authorization
signature. Future persistence must enforce actor permissions, CAS and audit on
a trusted server boundary.

`rptp_*` uses deterministic canonical serialization of the profile identity,
rules, suerte metadata and content metadata. Object property order does not
affect it; a material rule change does. Lifecycle state, revision, transition
audit and lifecycle timestamps are excluded, so progressing the state machine
does not alter the frozen sports-content identity. It is an integrity guard, not
a cryptographic signature or certified sports checksum.

## Current exclusions

This ticket does not add:

- Firebase paths or Rules;
- a callable or production authority;
- profile assignment by tournament;
- profile activation UI;
- a global default;
- a pilot tournament;
- scoring, Portal, Broadcast or judge changes;
- production writes, deploy, commit or push.
- cache-buster changes; this checkpoint is not deployed and must receive normal
  release versioning before any future client publication.

## Consolidation coverage

The directed suite covers the complete transition matrix and terminal states,
CAS, idempotent retry and conflict, exact temporal boundaries, explicit offsets,
ambiguous local dates, date-source priority, gaps, overlaps, missing matches,
legacy exact resolution, formal Product Base fallback, no silent FMCH selection,
historical tournament pinning, in-progress boundary scenarios, Attempt V2
reference preservation, input immutability and temporal fingerprint behavior.

## Next prerequisites

Production lifecycle requires a separate trusted service that:

1. stores immutable profile versions and lifecycle state;
2. authorizes actor, tenant, organization and environment;
3. applies transitions with server time, CAS and idempotency;
4. appends immutable audit events;
5. rejects `activationReady !== true`;
6. verifies the certified content fingerprint;
7. exposes read-only temporal resolution to clients.

Tournament assignment then requires a separate audited operation that pins an
exact profile/version and effective anchor, rejects tournaments with incompatible
official scores, and never falls back across tenants or organizations.
