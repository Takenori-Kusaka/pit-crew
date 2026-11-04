# Inventory reservation load test (2026-09-08)
Run after the reservation service was replaced on 2026-09-01 (reservations are now batched). p99 reservation latency:
| lines per cart | p99 latency |
|---|---|
| 60 | 0.5 s |
| 100 | 0.9 s |
| 150 | 1.7 s |
Checkout times out at 2.0 s.
