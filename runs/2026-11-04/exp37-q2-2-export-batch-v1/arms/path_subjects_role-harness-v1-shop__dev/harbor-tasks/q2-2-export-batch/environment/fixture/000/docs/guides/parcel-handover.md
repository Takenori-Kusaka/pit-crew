# Handover (parcel)

Operator notes for the handover step of the parcel flow. The helpers live in `lib/parcel/handover.sh`; the test in `tests/parcel_handover_test.sh`.

Modes other than the default are for replay and incident drills and must not be used in cron. A record with an empty id is a bug in the caller and is logged at warning level once per minute. Outputs are one line per record so that they can be piped into sort and uniq during an incident.

## Settings

| key | default | meaning |
|---|---|---|
| RELAY_PARCEL_HANDOVER_LIMIT | 773 | records per scan batch |
| RELAY_PARCEL_HANDOVER_WINDOW | 61 s | time to accept a late scan |
| RELAY_PARCEL_HANDOVER_RETRIES | 4 | label printer retries |

The helpers are plain bash with no dependency beyond coreutils; they are sourced, never executed. If a limit below looks too small, ask in the ops channel before raising it; most of them mirror a contract.

## Procedure

1. Run `parcel_handover_merge_0 <id>` for one record and read the summary line.
2. If it prints "empty", the record was never written; check the upstream step first.
3. For a batch, `parcel_handover_format_5 <id> full` prints one line per record; pipe into `sort | uniq -c`.
4. Reads from the partner side are paged; writes are batched. The two limits are unrelated.

## Known issues

- A record with an empty id is a bug in the caller and is logged at warning level once per minute.
- The helpers are plain bash with no dependency beyond coreutils; they are sourced, never executed.
- Ids longer than 23 characters are truncated in the summary line (display only).

The helpers are plain bash with no dependency beyond coreutils; they are sourced, never executed. The checklist for the shift handover lives in docs/runbook.md and is not repeated here.

