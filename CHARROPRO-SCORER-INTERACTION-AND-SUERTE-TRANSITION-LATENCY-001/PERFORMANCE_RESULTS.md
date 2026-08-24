# Performance Results

## Browser Real Local

Environment: real browser DOM against LOCAL/EMULATOR synthetic tournament data.

| Metric | Before | After |
| --- | ---: | ---: |
| Touch to local state | 51.1 ms | 2.3 ms |
| Touch to DOM | 359.2 ms | 9.1 ms |
| Touch to visible | 365.1 ms | 15.8 ms |
| Switch to resolved | 45.5 ms | 1.5 ms |
| Switch to DOM | 312.0 ms | 6.6 ms |
| Switch to visible | 316.8 ms | 16.0 ms |
| Switch to sync ready | 317.6 ms | 16.7 ms |

Repeated switch stress: 30 samples, median 16.4 ms, p95 17.8 ms, max 18.3 ms.

## Node Synthetic

`tools/performance/scorerLatencyAudit.mjs` uses a 543,108-byte realistic state and 120 iterations. Its output is explicitly labeled `NODE_SYNTHETIC`; it validates relative critical-path work and must not be presented as an iPad measurement.

Physical iPad perception remains `NEEDS_PHYSICAL_VALIDATION`.
