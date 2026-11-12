# ADR-0019: SMS resend policy

| | |
|---|---|
| Status | accepted |
| Date | 2025-10-16 |
| Supersedes | - |

## Context

The SMS gateway returns transient errors during carrier maintenance.

## Decision

Resend a failed SMS at most 3 times, waiting 1 s, 2 s and 4 s. After that the message is parked for the next shift.

## Consequences

This is a notification policy. Webhook delivery to partners has its own retry policy (ADR-0009).

