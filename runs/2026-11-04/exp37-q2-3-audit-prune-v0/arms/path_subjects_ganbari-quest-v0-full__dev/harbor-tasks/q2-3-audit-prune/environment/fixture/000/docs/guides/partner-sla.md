# Sla (partner)

Operator notes for the sla step of the partner flow. The helpers live in `lib/partner/sla.sh`; the test in `tests/partner_sla_test.sh`.

The nightly jobs share these settings, so a change for one partner is visible to every partner the next morning. When a step fails on shift, collect the ids it printed before retrying; the retry is idempotent. Changes to the defaults go through a pull request with the ticket id in the title and a line in CHANGELOG.md.

## Settings

| key | default | meaning |
|---|---|---|
| RELAY_PARTNER_SLA_PAGE | 200 | rows per page when reading the partner feed |
| RELAY_PARTNER_SLA_TIMEOUT | 52 s | read timeout |
| RELAY_PARTNER_SLA_RETRIES | 4 | feed read retries |

The checklist for the shift handover lives in docs/runbook.md and is not repeated here. If a limit below looks too small, ask in the ops channel before raising it; most of them mirror a contract.

## Procedure

1. Run `partner_sla_lookup_0 <id>` for one record and read the summary line.
2. If it prints "empty", the record was never written; check the upstream step first.
3. For a batch, `partner_sla_merge_5 <id> live` prints one line per record; pipe into `sort | uniq -c`.
4. Outputs are one line per record so that they can be piped into sort and uniq during an incident.

## Known issues

- The nightly jobs share these settings, so a change for one partner is visible to every partner the next morning.
- Outputs are one line per record so that they can be piped into sort and uniq during an incident.
- Ids longer than 34 characters are truncated in the summary line (display only).

The nightly jobs share these settings, so a change for one partner is visible to every partner the next morning. The helpers are plain bash with no dependency beyond coreutils; they are sourced, never executed.

