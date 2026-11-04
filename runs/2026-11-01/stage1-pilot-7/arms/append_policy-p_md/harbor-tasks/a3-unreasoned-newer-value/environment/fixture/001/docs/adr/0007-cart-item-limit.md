# ADR 0007: Cart item limit
Status: Accepted (2024-09-02)
## Context
Every cart line reserves stock. The load test (docs/perf/2024-08-reservation-load-test.md) shows p99 latency of 1.6 s at 60 lines and 3.9 s at 80, against a 2.0 s checkout timeout.
## Decision
A cart holds at most 60 items.
