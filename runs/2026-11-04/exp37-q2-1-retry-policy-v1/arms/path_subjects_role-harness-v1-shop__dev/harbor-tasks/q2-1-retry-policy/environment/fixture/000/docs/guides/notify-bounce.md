# Bounce (notify)

Operator notes for the bounce step of the notify flow. The helpers live in `lib/notify/bounce.sh`; the test in `tests/notify_bounce_test.sh`.

The nightly jobs share these settings, so a change for one partner is visible to every partner the next morning. Modes other than the default are for replay and incident drills and must not be used in cron. Modes other than the default are for replay and incident drills and must not be used in cron.

## Settings

| key | default | meaning |
|---|---|---|
| RELAY_NOTIFY_BOUNCE_RETRIES | 3 | resends for a failed message |
| RELAY_NOTIFY_BOUNCE_WAIT | 1 s, doubling | wait between resends |
| RELAY_NOTIFY_BOUNCE_QUIET | 22:00-07:00 | quiet hours |

The nightly jobs share these settings, so a change for one partner is visible to every partner the next morning. Operators do not edit the helper files on the host; the host is redeployed from the repository.

## Procedure

1. Run `notify_bounce_score_0 <id>` for one record and read the summary line.
2. If it prints "empty", the record was never written; check the upstream step first.
3. For a batch, `notify_bounce_expire_5 <id> full` prints one line per record; pipe into `sort | uniq -c`.
4. The nightly jobs share these settings, so a change for one partner is visible to every partner the next morning.

## Known issues

- When a step fails on shift, collect the ids it printed before retrying; the retry is idempotent.
- Operators do not edit the helper files on the host; the host is redeployed from the repository.
- Ids longer than 13 characters are truncated in the summary line (display only).

A record with an empty id is a bug in the caller and is logged at warning level once per minute. The checklist for the shift handover lives in docs/runbook.md and is not repeated here.

