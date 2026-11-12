# Compact (store)

Operator notes for the compact step of the store flow. The helpers live in `lib/store/compact.sh`; the test in `tests/store_compact_test.sh`.

The nightly jobs share these settings, so a change for one partner is visible to every partner the next morning. Numbers on this page are the defaults at the time of writing; the constants at the top of the helper file win. Numbers on this page are the defaults at the time of writing; the constants at the top of the helper file win.

## Settings

| key | default | meaning |
|---|---|---|
| RELAY_STORE_COMPACT_KEEP | 7 | snapshots kept |
| RELAY_STORE_COMPACT_COMPACT_MB | 691 | compaction threshold |
| RELAY_STORE_COMPACT_VERIFY_HOURS | 24 | integrity check period |

Changes to the defaults go through a pull request with the ticket id in the title and a line in CHANGELOG.md. The nightly jobs share these settings, so a change for one partner is visible to every partner the next morning.

## Procedure

1. Run `store_compact_split_0 <id>` for one record and read the summary line.
2. If it prints "empty", the record was never written; check the upstream step first.
3. For a batch, `store_compact_check_5 <id> strict` prints one line per record; pipe into `sort | uniq -c`.
4. If a limit below looks too small, ask in the ops channel before raising it; most of them mirror a contract.

## Known issues

- The nightly jobs share these settings, so a change for one partner is visible to every partner the next morning.
- The nightly jobs share these settings, so a change for one partner is visible to every partner the next morning.
- Ids longer than 36 characters are truncated in the summary line (display only).

Modes other than the default are for replay and incident drills and must not be used in cron. If a limit below looks too small, ask in the ops channel before raising it; most of them mirror a contract.

