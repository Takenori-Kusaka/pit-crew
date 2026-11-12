# ADR-0005: Test layout

| | |
|---|---|
| Status | accepted |
| Date | 2025-03-14 |
| Supersedes | - |

## Context

Tests were shell snippets in the README and were never run.

## Decision

One test per module in tests/<domain>_<noun>_test.sh, bash, exit 0 on pass; scripts/verify.sh runs all of them and records the run.

## Consequences

A change that breaks a test is not merged; a module without a test is not sourced by bin/.

