# Mapping (partner)

Operator notes for the mapping step of the partner flow. The helpers live in `lib/partner/mapping.sh`; the test in `tests/partner_mapping_test.sh`.

Reads from the partner side are paged; writes are batched. The two limits are unrelated. The checklist for the shift handover lives in docs/runbook.md and is not repeated here. Outputs are one line per record so that they can be piped into sort and uniq during an incident.

## Settings

| key | default | meaning |
|---|---|---|
| RELAY_PARTNER_MAPPING_PAGE | 100 | rows per page when reading the partner feed |
| RELAY_PARTNER_MAPPING_TIMEOUT | 16 s | read timeout |
| RELAY_PARTNER_MAPPING_RETRIES | 2 | feed read retries |

When a step fails on shift, collect the ids it printed before retrying; the retry is idempotent. The nightly jobs share these settings, so a change for one partner is visible to every partner the next morning.

## Procedure

1. Run `partner_mapping_split_0 <id>` for one record and read the summary line.
2. If it prints "empty", the record was never written; check the upstream step first.
3. For a batch, `partner_mapping_check_5 <id> full` prints one line per record; pipe into `sort | uniq -c`.
4. Modes other than the default are for replay and incident drills and must not be used in cron.

## Known issues

- The helpers are plain bash with no dependency beyond coreutils; they are sourced, never executed.
- Modes other than the default are for replay and incident drills and must not be used in cron.
- Ids longer than 21 characters are truncated in the summary line (display only).

Modes other than the default are for replay and incident drills and must not be used in cron. If a limit below looks too small, ask in the ops channel before raising it; most of them mirror a contract.

