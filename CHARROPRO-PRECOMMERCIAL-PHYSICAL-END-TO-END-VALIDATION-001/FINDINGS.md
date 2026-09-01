# Findings

## ENV-001 - Local Fixture Could Not Be Seeded

**Actual:** `local:seed` failed with `invalid key (FMCH.TEAM_SHEET.CALA.MD)`.

**First loss:** the development seed persisted the full Rule Profile catalog,
including FieldIDs, directly to RTDB.

**Resolution:** local-only serialization now removes `fieldIdMappings` from
the persisted fixture profile and removes the embedded profile catalog from
the tournament index. Profile identity and certified fingerprint stay intact.

**Scope:** development tooling and tests only. No production profile, FieldID,
RuleID, RTDB Rule, Function, or sporting value changed.

**Status:** RESOLVED LOCALLY, pending normal review and versioning.

## ENV-002 - Responsive Browser Evidence Is Not Representative

**Actual:** viewport overrides requested for 390x844 retained browser values
of 1600x900 and a 1581px document width.

**First loss:** the test-browser viewport capability did not apply a layout
viewport override to this local app session.

**Status:** INCONCLUSIVE, not a product defect. Test on actual tablet/iPad and
phone hardware before granting responsive PASS.

## ENV-003 - Program Composition Is Not Configured In The Demo Fixture

**Actual:** Program Main is empty and Announcer Monitor displays unavailable
context while the independent timer outputs render the active local timer.

**First loss:** fixture configuration. No Program session/composition or
announcer projection was created for the tournament.

**Status:** PENDING_CONFIGURATION. This is not evidence of an output consumer
failure. Configure a clearly local Program composition before repeating the
multisurface output test.
