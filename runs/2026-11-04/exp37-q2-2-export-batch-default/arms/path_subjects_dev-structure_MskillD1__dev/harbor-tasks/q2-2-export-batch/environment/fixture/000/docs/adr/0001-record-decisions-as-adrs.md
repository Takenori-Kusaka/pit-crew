# ADR-0001: Record decisions as ADRs

| | |
|---|---|
| Status | accepted |
| Date | 2025-01-10 |
| Supersedes | - |

## Context

Decisions were spread over chat and pull requests and could not be found when a module was rewritten.

## Decision

Every decision that a future change could reverse is written to docs/adr/NNNN-title.md with status, context, decision and consequences. The index is docs/adr/README.md.

## Consequences

Drafts under docs/design/ are working notes; an accepted ADR on the same subject supersedes them and names the section it replaces.

