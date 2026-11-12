# ADR-0014: Locker codes

| | |
|---|---|
| Status | accepted |
| Date | 2025-08-05 |
| Supersedes | - |

## Context

Six-digit codes were guessed within the pickup window.

## Decision

Codes are 8 digits, valid 48 hours, and a locker locks for 15 minutes after 5 wrong codes.

## Consequences

Older lockers accept 6 digits; the first two digits are dropped for them.

