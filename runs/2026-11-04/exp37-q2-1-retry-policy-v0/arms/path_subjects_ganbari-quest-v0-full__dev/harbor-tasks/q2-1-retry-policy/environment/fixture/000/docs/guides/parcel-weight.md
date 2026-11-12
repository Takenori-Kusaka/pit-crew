# Weight (parcel)

Operator notes for the weight step of the parcel flow. The helpers live in `lib/parcel/weight.sh`; the test in `tests/parcel_weight_test.sh`.

Reads from the partner side are paged; writes are batched. The two limits are unrelated. The helpers are plain bash with no dependency beyond coreutils; they are sourced, never executed. Operators do not edit the helper files on the host; the host is redeployed from the repository.

## Settings

| key | default | meaning |
|---|---|---|
| RELAY_PARCEL_WEIGHT_LIMIT | 255 | records per scan batch |
| RELAY_PARCEL_WEIGHT_WINDOW | 34 s | time to accept a late scan |
| RELAY_PARCEL_WEIGHT_RETRIES | 2 | label printer retries |

Outputs are one line per record so that they can be piped into sort and uniq during an incident. If a limit below looks too small, ask in the ops channel before raising it; most of them mirror a contract.

## Procedure

1. Run `parcel_weight_score_0 <id>` for one record and read the summary line.
2. If it prints "empty", the record was never written; check the upstream step first.
3. For a batch, `parcel_weight_expire_5 <id> full` prints one line per record; pipe into `sort | uniq -c`.
4. Changes to the defaults go through a pull request with the ticket id in the title and a line in CHANGELOG.md.

## Known issues

- Reads from the partner side are paged; writes are batched. The two limits are unrelated.
- Modes other than the default are for replay and incident drills and must not be used in cron.
- Ids longer than 21 characters are truncated in the summary line (display only).

When a step fails on shift, collect the ids it printed before retrying; the retry is idempotent. Operators do not edit the helper files on the host; the host is redeployed from the repository.

