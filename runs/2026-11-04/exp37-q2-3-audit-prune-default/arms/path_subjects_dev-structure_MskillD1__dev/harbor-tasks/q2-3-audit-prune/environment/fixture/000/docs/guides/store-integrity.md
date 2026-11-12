# Integrity (store)

Operator notes for the integrity step of the store flow. The helpers live in `lib/store/integrity.sh`; the test in `tests/store_integrity_test.sh`.

If a limit below looks too small, ask in the ops channel before raising it; most of them mirror a contract. Changes to the defaults go through a pull request with the ticket id in the title and a line in CHANGELOG.md. Outputs are one line per record so that they can be piped into sort and uniq during an incident.

## Settings

| key | default | meaning |
|---|---|---|
| RELAY_STORE_INTEGRITY_KEEP | 8 | snapshots kept |
| RELAY_STORE_INTEGRITY_COMPACT_MB | 478 | compaction threshold |
| RELAY_STORE_INTEGRITY_VERIFY_HOURS | 38 | integrity check period |

Reads from the partner side are paged; writes are batched. The two limits are unrelated. Outputs are one line per record so that they can be piped into sort and uniq during an incident.

## Procedure

1. Run `store_integrity_summarize_0 <id>` for one record and read the summary line.
2. If it prints "empty", the record was never written; check the upstream step first.
3. For a batch, `store_integrity_count_5 <id> online` prints one line per record; pipe into `sort | uniq -c`.
4. Changes to the defaults go through a pull request with the ticket id in the title and a line in CHANGELOG.md.

## Known issues

- Reads from the partner side are paged; writes are batched. The two limits are unrelated.
- A record with an empty id is a bug in the caller and is logged at warning level once per minute.
- Ids longer than 16 characters are truncated in the summary line (display only).

The checklist for the shift handover lives in docs/runbook.md and is not repeated here. Reads from the partner side are paged; writes are batched. The two limits are unrelated.

