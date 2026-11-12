# ADR-0020: CSRF tokens on the operator forms

| | |
|---|---|
| Status | accepted |
| Date | 2025-11-23 |
| Supersedes | - |

## Context

An operator form could be submitted from another tab.

## Decision

Every form carries a per-session token checked by lib/web/csrf.sh; tokens expire with the session.

## Consequences

Replayed forms are rejected with 403 and logged at warn.

