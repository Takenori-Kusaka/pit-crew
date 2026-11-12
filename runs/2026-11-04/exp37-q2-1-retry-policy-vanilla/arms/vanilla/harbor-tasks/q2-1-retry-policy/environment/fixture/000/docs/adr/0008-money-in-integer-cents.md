# ADR-0008: Money in integer cents

| | |
|---|---|
| Status | accepted |
| Date | 2025-05-11 |
| Supersedes | - |

## Context

Floating point produced fee totals off by one cent.

## Decision

All amounts are integers in cents; display converts at the edge (cents_to_text).

## Consequences

Fees in basis points are integers too (RELAY_LEDGER_FEE_BP).

