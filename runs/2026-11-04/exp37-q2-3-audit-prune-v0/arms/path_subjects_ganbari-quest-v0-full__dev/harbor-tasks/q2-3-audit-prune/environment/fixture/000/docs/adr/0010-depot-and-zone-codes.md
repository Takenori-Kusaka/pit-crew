# ADR-0010: Depot and zone codes

| | |
|---|---|
| Status | accepted |
| Date | 2025-06-25 |
| Supersedes | - |

## Context

Zone codes differed between the route planner and the labels.

## Decision

A zone code is <depot 3 letters>-<2 digits>; depots are listed in config/depots.txt.

## Consequences

Labels printed before this decision carry the old codes until reprinted.

