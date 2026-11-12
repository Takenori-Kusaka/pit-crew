# ADR-0018: Archive compaction

| | |
|---|---|
| Status | accepted |
| Date | 2025-10-09 |
| Supersedes | - |

## Context

Snapshot directories exceeded the disk during a month-end run.

## Decision

Compact archives above 256 MB; keep 6 snapshots; verify integrity every 24 h.

## Consequences

Compaction runs before the nightly export so that both fit in the disk budget.

