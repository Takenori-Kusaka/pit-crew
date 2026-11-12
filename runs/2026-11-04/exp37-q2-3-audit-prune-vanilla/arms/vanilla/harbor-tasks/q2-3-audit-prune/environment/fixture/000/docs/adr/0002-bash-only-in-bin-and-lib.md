# ADR-0002: Bash only in bin/ and lib/

| | |
|---|---|
| Status | accepted |
| Date | 2025-02-17 |
| Supersedes | - |

## Context

The host image has no interpreter beyond bash and coreutils, and operators patch on shift.

## Decision

Tools and helpers are bash. Anything that needs more runs off-host and sends files.

## Consequences

Arithmetic is integer only; money is in cents (ADR-0008).

