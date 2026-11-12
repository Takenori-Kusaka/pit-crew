# Scan (parcel)

Operator notes for the scan step of the parcel flow. The helpers live in `lib/parcel/scan.sh`; the test in `tests/parcel_scan_test.sh`.

Modes other than the default are for replay and incident drills and must not be used in cron. Numbers on this page are the defaults at the time of writing; the constants at the top of the helper file win. Reads from the partner side are paged; writes are batched. The two limits are unrelated.

## Settings

| key | default | meaning |
|---|---|---|
| RELAY_PARCEL_SCAN_LIMIT | 843 | records per scan batch |
| RELAY_PARCEL_SCAN_WINDOW | 31 s | time to accept a late scan |
| RELAY_PARCEL_SCAN_RETRIES | 2 | label printer retries |

Changes to the defaults go through a pull request with the ticket id in the title and a line in CHANGELOG.md. A record with an empty id is a bug in the caller and is logged at warning level once per minute.

## Procedure

1. Run `parcel_scan_normalize_0 <id>` for one record and read the summary line.
2. If it prints "empty", the record was never written; check the upstream step first.
3. For a batch, `parcel_scan_summarize_5 <id> live` prints one line per record; pipe into `sort | uniq -c`.
4. The checklist for the shift handover lives in docs/runbook.md and is not repeated here.

## Known issues

- Modes other than the default are for replay and incident drills and must not be used in cron.
- Changes to the defaults go through a pull request with the ticket id in the title and a line in CHANGELOG.md.
- Ids longer than 14 characters are truncated in the summary line (display only).

Reads from the partner side are paged; writes are batched. The two limits are unrelated. Reads from the partner side are paged; writes are batched. The two limits are unrelated.

