# Webhook delivery (draft, 2025-11)

Status: draft.

## Flow

bin/deliver takes the command that performs the delivery and retries it. The body is signed (see the signing ADR).

## Retry

3 attempts with doubling waits (1, 2, 4 s). The count can be raised with RELAY_RETRY_MAX for a slow partner.

## Open questions

- Partner B's receiver takes long to come back after an outage; is 7 s enough?

