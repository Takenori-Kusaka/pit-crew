# ADR-0015: Audit log retention

| | |
|---|---|
| Status | accepted |
| Date | 2026-04-14 |
| Supersedes | docs/design/prune.md §Retention (draft) |

## Context

Partners can request a reconciliation of any period within the last 12 months (contract §7.3). A
request filed in January covers the previous January, so 365 days is not enough; the draft's 90
days was written before the clause existed. Shift logs (ADR-0016) are a different stream with a
different retention.

## Decision

- Keep audit logs for 400 days: 13 months, plus slack for a request filed late in the month.
- Prune by file modification time; the nightly job (docs/runbook.md, "Disk") removes older files.

## Consequences

- var/audit grows to about 2 GB at the current rate; the host has 40 GB.
- lib/prune/retention.sh owns the number; bin/prune consumes it.

