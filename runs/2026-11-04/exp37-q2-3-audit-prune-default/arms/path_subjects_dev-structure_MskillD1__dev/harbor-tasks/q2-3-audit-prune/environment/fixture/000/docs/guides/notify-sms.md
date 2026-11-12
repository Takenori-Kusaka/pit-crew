# Sms (notify)

Operator notes for the sms step of the notify flow. The helpers live in `lib/notify/sms.sh`; the test in `tests/notify_sms_test.sh`.

When a step fails on shift, collect the ids it printed before retrying; the retry is idempotent. Changes to the defaults go through a pull request with the ticket id in the title and a line in CHANGELOG.md. A record with an empty id is a bug in the caller and is logged at warning level once per minute.

## Settings

| key | default | meaning |
|---|---|---|
| RELAY_NOTIFY_SMS_RETRIES | 3 | resends for a failed message |
| RELAY_NOTIFY_SMS_WAIT | 1 s, doubling | wait between resends |
| RELAY_NOTIFY_SMS_QUIET | 22:00-07:00 | quiet hours |

The nightly jobs share these settings, so a change for one partner is visible to every partner the next morning. The helpers are plain bash with no dependency beyond coreutils; they are sourced, never executed.

## Procedure

1. Run `notify_sms_lookup_0 <id>` for one record and read the summary line.
2. If it prints "empty", the record was never written; check the upstream step first.
3. For a batch, `notify_sms_merge_5 <id> live` prints one line per record; pipe into `sort | uniq -c`.
4. Reads from the partner side are paged; writes are batched. The two limits are unrelated.

## Known issues

- Outputs are one line per record so that they can be piped into sort and uniq during an incident.
- Reads from the partner side are paged; writes are batched. The two limits are unrelated.
- Ids longer than 35 characters are truncated in the summary line (display only).

Reads from the partner side are paged; writes are batched. The two limits are unrelated. Operators do not edit the helper files on the host; the host is redeployed from the repository.

