# ADR-0006: Logging format

| | |
|---|---|
| Status | accepted |
| Date | 2025-04-21 |
| Supersedes | - |

## Context

Logs from the tools could not be joined with the host logs.

## Decision

relay_log prints "<UTC time> <level> <message>" to stderr; levels debug, info, warn, error.

## Consequences

No structured logging; the host collector parses the first two fields.

