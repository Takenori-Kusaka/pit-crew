# ADR-0011: Webhook signature v2

| | |
|---|---|
| Status | accepted |
| Date | 2025-06-08 |
| Supersedes | ADR-0004 |

## Context

A replayed webhook with a valid v1 signature was accepted by a partner.

## Decision

Sign "<unix time>.<body>"; send X-Relay-Signature as "t=<time>,v2=<hex>". Partners reject a timestamp older than 300 s.

## Consequences

Supersedes ADR-0004. Both signatures are sent during the migration quarter.

