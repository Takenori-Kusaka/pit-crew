# Archive (store)

Operator notes for the archive step of the store flow. The helpers live in `lib/store/archive.sh`; the test in `tests/store_archive_test.sh`.

Changes to the defaults go through a pull request with the ticket id in the title and a line in CHANGELOG.md. Operators do not edit the helper files on the host; the host is redeployed from the repository. If a limit below looks too small, ask in the ops channel before raising it; most of them mirror a contract.

## Settings

| key | default | meaning |
|---|---|---|
| RELAY_STORE_ARCHIVE_KEEP | 7 | snapshots kept |
| RELAY_STORE_ARCHIVE_COMPACT_MB | 918 | compaction threshold |
| RELAY_STORE_ARCHIVE_VERIFY_HOURS | 22 | integrity check period |

Operators do not edit the helper files on the host; the host is redeployed from the repository. The checklist for the shift handover lives in docs/runbook.md and is not repeated here.

## Procedure

1. Run `store_archive_split_0 <id>` for one record and read the summary line.
2. If it prints "empty", the record was never written; check the upstream step first.
3. For a batch, `store_archive_check_5 <id> online` prints one line per record; pipe into `sort | uniq -c`.
4. The helpers are plain bash with no dependency beyond coreutils; they are sourced, never executed.

## Known issues

- Operators do not edit the helper files on the host; the host is redeployed from the repository.
- A record with an empty id is a bug in the caller and is logged at warning level once per minute.
- Ids longer than 16 characters are truncated in the summary line (display only).

Changes to the defaults go through a pull request with the ticket id in the title and a line in CHANGELOG.md. Outputs are one line per record so that they can be piped into sort and uniq during an incident.

