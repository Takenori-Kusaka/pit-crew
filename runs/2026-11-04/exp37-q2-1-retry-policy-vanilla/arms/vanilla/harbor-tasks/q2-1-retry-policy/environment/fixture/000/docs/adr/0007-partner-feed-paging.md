# ADR-0007: Partner feed paging

| | |
|---|---|
| Status | accepted |
| Date | 2025-04-04 |
| Supersedes | - |

## Context

Reading the partner feed in one request timed out above about 3,000 rows.

## Decision

Read the partner feed 100 rows per page (the partner's documented page size); follow the next-page token until it is empty.

## Consequences

This is a read limit on the inbound feed. Writes to the partner are batched separately (ADR-0012).

