# Consumer Parity

The following surfaces consume the same official Timer fields and shared live
derivation:

- Scorer;
- phone Timer control;
- Timer Display;
- Graphics;
- Broadcast/Output Routing projections.

For the same snapshot and `now`, visible elapsed and remaining values are
identical. Broadcast contracts carry the official accumulated base, running
anchor, duration, mode, phase/context and policy identity; they do not publish
client-generated ticks.

Scorer and Graphics update only the Timer display nodes. No full scorer or full
graphic reconstruction occurs on a local tick. Timer Display rejects stale or
context-incompatible snapshots before replacing the current value.

Parity is covered by deterministic unit tests. Multi-device physical parity is
the required post-deploy acceptance step.
