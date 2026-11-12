# ADR-0021: Environment variable naming

| | |
|---|---|
| Status | accepted |
| Date | 2025-11-06 |
| Supersedes | - |

## Context

Variables were named after the person who added them.

## Decision

All variables start with RELAY_, then the flow, then the setting: RELAY_<FLOW>_<SETTING>. A rename is announced in CHANGELOG.md; the old name is read for one minor version and then dropped.

## Consequences

Renames since this decision are listed in CHANGELOG.md, not here.

