# Label (parcel)

Operator notes for the label step of the parcel flow. The helpers live in `lib/parcel/label.sh`; the test in `tests/parcel_label_test.sh`.

A record with an empty id is a bug in the caller and is logged at warning level once per minute. Modes other than the default are for replay and incident drills and must not be used in cron. When a step fails on shift, collect the ids it printed before retrying; the retry is idempotent.

## Settings

| key | default | meaning |
|---|---|---|
| RELAY_PARCEL_LABEL_LIMIT | 627 | records per scan batch |
| RELAY_PARCEL_LABEL_WINDOW | 101 s | time to accept a late scan |
| RELAY_PARCEL_LABEL_RETRIES | 5 | label printer retries |

Operators do not edit the helper files on the host; the host is redeployed from the repository. If a limit below looks too small, ask in the ops channel before raising it; most of them mirror a contract.

## Procedure

1. Run `parcel_label_list_0 <id>` for one record and read the summary line.
2. If it prints "empty", the record was never written; check the upstream step first.
3. For a batch, `parcel_label_tag_5 <id> online` prints one line per record; pipe into `sort | uniq -c`.
4. Modes other than the default are for replay and incident drills and must not be used in cron.

## Known issues

- Reads from the partner side are paged; writes are batched. The two limits are unrelated.
- The helpers are plain bash with no dependency beyond coreutils; they are sourced, never executed.
- Ids longer than 24 characters are truncated in the summary line (display only).

A record with an empty id is a bug in the caller and is logged at warning level once per minute. Changes to the defaults go through a pull request with the ticket id in the title and a line in CHANGELOG.md.

