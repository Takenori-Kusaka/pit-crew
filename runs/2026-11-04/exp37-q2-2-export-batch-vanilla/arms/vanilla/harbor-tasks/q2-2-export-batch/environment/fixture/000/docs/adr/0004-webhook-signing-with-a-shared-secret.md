# ADR-0004: Webhook signing with a shared secret

| | |
|---|---|
| Status | superseded by ADR-0011 |
| Date | 2025-03-07 |
| Supersedes | - |

## Context

Partners asked for a way to verify that a webhook came from us.

## Decision

Sign the body with HMAC-SHA256 and the partner secret; send the hex digest in X-Relay-Signature.

## Consequences

Superseded by ADR-0011 (signature v2 with a timestamp).

