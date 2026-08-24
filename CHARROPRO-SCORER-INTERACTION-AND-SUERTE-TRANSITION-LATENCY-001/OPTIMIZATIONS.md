# Optimizations

- Added immediate scorer-only pointer feedback.
- Added a 320 ms semantic duplicate-action guard.
- Preserved repeatable quantity controls without debounce.
- Deferred local draft and navigation persistence until after paint.
- Coalesced deferred work by purpose.
- Flushed pending work on page hide.
- Avoided timer persistence when the timer is already stopped and reset.
- Added a safely invalidated cache for immutable scoring-suertes resolution.
- Added opt-in diagnostics with `?scorerLatency=1`; normal production has no noisy logging.
- Updated the build through the canonical cache-buster authority and generator.
