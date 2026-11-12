# ADR-0003: Configuration through env files

| | |
|---|---|
| Status | accepted |
| Date | 2025-02-24 |
| Supersedes | - |

## Context

Tools took flags, env and a yaml file; the same setting had three names.

## Decision

Settings are environment variables loaded by lib/common/env.sh from config/defaults.env and config/partners/<partner>.env. Flags are for the current invocation only.

## Consequences

A rename of a variable goes to CHANGELOG.md with the version that stops reading the old name (ADR-0021).

