# Restore (store)

Operator notes for the restore step of the store flow. The helpers live in `lib/store/restore.sh`; the test in `tests/store_restore_test.sh`.

The checklist for the shift handover lives in docs/runbook.md and is not repeated here. Modes other than the default are for replay and incident drills and must not be used in cron. Operators do not edit the helper files on the host; the host is redeployed from the repository.

## Settings

| key | default | meaning |
|---|---|---|
| RELAY_STORE_RESTORE_KEEP | 11 | snapshots kept |
| RELAY_STORE_RESTORE_COMPACT_MB | 733 | compaction threshold |
| RELAY_STORE_RESTORE_VERIFY_HOURS | 7 | integrity check period |

The helpers are plain bash with no dependency beyond coreutils; they are sourced, never executed. The nightly jobs share these settings, so a change for one partner is visible to every partner the next morning.

## Procedure

1. Run `store_restore_split_0 <id>` for one record and read the summary line.
2. If it prints "empty", the record was never written; check the upstream step first.
3. For a batch, `store_restore_check_5 <id> online` prints one line per record; pipe into `sort | uniq -c`.
4. Operators do not edit the helper files on the host; the host is redeployed from the repository.

## Known issues

- Reads from the partner side are paged; writes are batched. The two limits are unrelated.
- Modes other than the default are for replay and incident drills and must not be used in cron.
- Ids longer than 39 characters are truncated in the summary line (display only).

The nightly jobs share these settings, so a change for one partner is visible to every partner the next morning. The checklist for the shift handover lives in docs/runbook.md and is not repeated here.

