# ADR-0016: Shift log retention

| | |
|---|---|
| Status | accepted |
| Date | 2025-09-19 |
| Supersedes | - |

## Context

Shift logs grew without bound and nobody read them after a week.

## Decision

Keep shift logs 30 days under var/log/shift; the host rotates them. This is an operational log, not an audit record.

## Consequences

Audit records have their own retention (ADR-0015) and are never under var/log.

