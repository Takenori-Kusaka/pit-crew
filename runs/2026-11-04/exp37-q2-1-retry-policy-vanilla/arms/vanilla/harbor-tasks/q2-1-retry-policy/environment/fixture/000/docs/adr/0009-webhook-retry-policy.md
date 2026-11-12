# ADR-0009: Webhook retry policy

| | |
|---|---|
| Status | accepted |
| Date | 2026-01-19 |
| Supersedes | docs/design/delivery.md §Retry (draft) |

## Context

Partner receivers fail in bursts. Partner B's receiver, the slowest we deliver to, recovers within
about 30 s of an outage (incident RLY-402, three occurrences). The draft in docs/design/delivery.md
proposed 3 attempts with doubling waits (1, 2, 4 s): a total budget of 7 s, which gives up before
a receiver that is coming back.

## Decision

- Attempts: 4 per delivery (the first try and three retries).
- Wait before attempt i+1: 3^i seconds, i.e. 3 s, 9 s, 27 s. Total budget 39 s, which covers the
  observed 30 s recovery with one attempt after it.
- The count is configurable per run by the operator (docs/runbook.md, "Slow endpoints"); the
  waits keep the same progression.
- Not 5 attempts with doubling from 1 s (1 + 2 + 4 + 8 = 15 s): still inside the outage window.
- Not a fixed 10 s wait: it hammers a receiver that is restarting.

## Consequences

- A failed delivery occupies a worker for up to 39 s. The worker pool was raised from 8 to 12.
- lib/delivery/retry.sh owns the schedule; bin/deliver only consumes it.

