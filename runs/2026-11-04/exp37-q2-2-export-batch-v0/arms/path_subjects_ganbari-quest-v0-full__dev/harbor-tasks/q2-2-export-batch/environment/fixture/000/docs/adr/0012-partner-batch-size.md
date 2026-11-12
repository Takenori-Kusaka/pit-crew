# ADR-0012: Partner batch size

| | |
|---|---|
| Status | accepted |
| Date | 2026-03-02 |
| Supersedes | docs/design/export.md §Batches (draft) |

## Context

The partner's batch endpoint (POST /v2/batch) documents a ceiling of 500 rows per request. Their
integration team asked us (ticket PRT-88) to stay at or below half of it: the ceiling counts rows
after their own expansion of multi-parcel entries, and a 500-row request from us was rejected
with 413 when it expanded. The draft in docs/design/export.md used 100, which is the page size for
reading the partner feed (ADR-0007), a different limit.

## Decision

- Send at most 250 rows per request; the last request carries the remainder.
- 250 is not configurable: the ceiling is the partner's, not ours.

## Consequences

- A 10,000-row night is 40 requests; at the partner's 2 requests/s that is 20 s.
- lib/export/batch.sh owns the size; bin/export consumes it.

