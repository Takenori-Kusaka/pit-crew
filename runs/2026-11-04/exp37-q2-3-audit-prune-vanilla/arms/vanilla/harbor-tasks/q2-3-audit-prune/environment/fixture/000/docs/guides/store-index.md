# Index (store)

Operator notes for the index step of the store flow. The helpers live in `lib/store/index.sh`; the test in `tests/store_index_test.sh`.

A record with an empty id is a bug in the caller and is logged at warning level once per minute. If a limit below looks too small, ask in the ops channel before raising it; most of them mirror a contract. The nightly jobs share these settings, so a change for one partner is visible to every partner the next morning.

## Settings

| key | default | meaning |
|---|---|---|
| RELAY_STORE_INDEX_KEEP | 3 | snapshots kept |
| RELAY_STORE_INDEX_COMPACT_MB | 924 | compaction threshold |
| RELAY_STORE_INDEX_VERIFY_HOURS | 27 | integrity check period |

Numbers on this page are the defaults at the time of writing; the constants at the top of the helper file win. The helpers are plain bash with no dependency beyond coreutils; they are sourced, never executed.

## Procedure

1. Run `store_index_list_0 <id>` for one record and read the summary line.
2. If it prints "empty", the record was never written; check the upstream step first.
3. For a batch, `store_index_tag_5 <id> full` prints one line per record; pipe into `sort | uniq -c`.
4. The helpers are plain bash with no dependency beyond coreutils; they are sourced, never executed.

## Known issues

- Operators do not edit the helper files on the host; the host is redeployed from the repository.
- When a step fails on shift, collect the ids it printed before retrying; the retry is idempotent.
- Ids longer than 40 characters are truncated in the summary line (display only).

Changes to the defaults go through a pull request with the ticket id in the title and a line in CHANGELOG.md. Reads from the partner side are paged; writes are batched. The two limits are unrelated.

