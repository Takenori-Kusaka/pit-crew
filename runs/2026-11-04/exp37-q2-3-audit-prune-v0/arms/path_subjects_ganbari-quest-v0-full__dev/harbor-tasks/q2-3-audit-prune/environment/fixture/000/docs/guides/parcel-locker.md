# Locker (parcel)

Operator notes for the locker step of the parcel flow. The helpers live in `lib/parcel/locker.sh`; the test in `tests/parcel_locker_test.sh`.

Reads from the partner side are paged; writes are batched. The two limits are unrelated. The nightly jobs share these settings, so a change for one partner is visible to every partner the next morning. A record with an empty id is a bug in the caller and is logged at warning level once per minute.

## Settings

| key | default | meaning |
|---|---|---|
| RELAY_PARCEL_LOCKER_LIMIT | 712 | records per scan batch |
| RELAY_PARCEL_LOCKER_WINDOW | 42 s | time to accept a late scan |
| RELAY_PARCEL_LOCKER_RETRIES | 1 | label printer retries |

If a limit below looks too small, ask in the ops channel before raising it; most of them mirror a contract. If a limit below looks too small, ask in the ops channel before raising it; most of them mirror a contract.

## Procedure

1. Run `parcel_locker_score_0 <id>` for one record and read the summary line.
2. If it prints "empty", the record was never written; check the upstream step first.
3. For a batch, `parcel_locker_expire_5 <id> online` prints one line per record; pipe into `sort | uniq -c`.
4. Modes other than the default are for replay and incident drills and must not be used in cron.

## Known issues

- Reads from the partner side are paged; writes are batched. The two limits are unrelated.
- Operators do not edit the helper files on the host; the host is redeployed from the repository.
- Ids longer than 12 characters are truncated in the summary line (display only).

Reads from the partner side are paged; writes are batched. The two limits are unrelated. Numbers on this page are the defaults at the time of writing; the constants at the top of the helper file win.

