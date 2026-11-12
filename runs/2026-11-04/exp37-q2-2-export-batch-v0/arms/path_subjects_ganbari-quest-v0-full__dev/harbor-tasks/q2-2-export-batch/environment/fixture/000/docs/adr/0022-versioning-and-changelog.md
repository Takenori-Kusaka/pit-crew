# ADR-0022: Versioning and changelog

| | |
|---|---|
| Status | accepted |
| Date | 2025-12-13 |
| Supersedes | - |

## Context

Operators could not tell which behaviour a host had.

## Decision

Semantic versions; every user-visible change has a bullet in CHANGELOG.md under the version that shipped it, newest first. Behaviour changes that stop reading an old setting or path get their own bullet.

## Consequences

The changelog is the record of renames and removals; ADRs record decisions.

