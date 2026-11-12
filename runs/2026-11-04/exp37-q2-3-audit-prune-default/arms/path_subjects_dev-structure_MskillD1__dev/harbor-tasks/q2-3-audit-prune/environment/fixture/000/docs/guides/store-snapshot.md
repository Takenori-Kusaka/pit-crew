# Snapshot (store)

Operator notes for the snapshot step of the store flow. The helpers live in `lib/store/snapshot.sh`; the test in `tests/store_snapshot_test.sh`.

Reads from the partner side are paged; writes are batched. The two limits are unrelated. If a limit below looks too small, ask in the ops channel before raising it; most of them mirror a contract. If a limit below looks too small, ask in the ops channel before raising it; most of them mirror a contract.

## Settings

| key | default | meaning |
|---|---|---|
| RELAY_STORE_SNAPSHOT_KEEP | 9 | snapshots kept |
| RELAY_STORE_SNAPSHOT_COMPACT_MB | 122 | compaction threshold |
| RELAY_STORE_SNAPSHOT_VERIFY_HOURS | 27 | integrity check period |

Modes other than the default are for replay and incident drills and must not be used in cron. Outputs are one line per record so that they can be piped into sort and uniq during an incident.

## Procedure

1. Run `store_snapshot_merge_0 <id>` for one record and read the summary line.
2. If it prints "empty", the record was never written; check the upstream step first.
3. For a batch, `store_snapshot_format_5 <id> strict` prints one line per record; pipe into `sort | uniq -c`.
4. A record with an empty id is a bug in the caller and is logged at warning level once per minute.

## Known issues

- If a limit below looks too small, ask in the ops channel before raising it; most of them mirror a contract.
- Numbers on this page are the defaults at the time of writing; the constants at the top of the helper file win.
- Ids longer than 28 characters are truncated in the summary line (display only).

Reads from the partner side are paged; writes are batched. The two limits are unrelated. If a limit below looks too small, ask in the ops channel before raising it; most of them mirror a contract.

