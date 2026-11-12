# ADR-0013: Notification quiet hours

| | |
|---|---|
| Status | accepted |
| Date | 2025-07-22 |
| Supersedes | - |

## Context

Customers complained about SMS at night.

## Decision

No SMS or push between 22:00 and 07:00 local time; email is not affected. Messages queue until 07:00.

## Consequences

A delivery window promised for 06:00 sends its reminder the evening before.

