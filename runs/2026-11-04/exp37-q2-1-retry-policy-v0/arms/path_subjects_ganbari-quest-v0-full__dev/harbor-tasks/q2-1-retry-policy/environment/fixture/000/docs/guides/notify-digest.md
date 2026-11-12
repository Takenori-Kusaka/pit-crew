# Digest (notify)

Operator notes for the digest step of the notify flow. The helpers live in `lib/notify/digest.sh`; the test in `tests/notify_digest_test.sh`.

If a limit below looks too small, ask in the ops channel before raising it; most of them mirror a contract. Reads from the partner side are paged; writes are batched. The two limits are unrelated. Changes to the defaults go through a pull request with the ticket id in the title and a line in CHANGELOG.md.

## Settings

| key | default | meaning |
|---|---|---|
| RELAY_NOTIFY_DIGEST_RETRIES | 3 | resends for a failed message |
| RELAY_NOTIFY_DIGEST_WAIT | 1 s, doubling | wait between resends |
| RELAY_NOTIFY_DIGEST_QUIET | 22:00-07:00 | quiet hours |

The checklist for the shift handover lives in docs/runbook.md and is not repeated here. Changes to the defaults go through a pull request with the ticket id in the title and a line in CHANGELOG.md.

## Procedure

1. Run `notify_digest_score_0 <id>` for one record and read the summary line.
2. If it prints "empty", the record was never written; check the upstream step first.
3. For a batch, `notify_digest_expire_5 <id> strict` prints one line per record; pipe into `sort | uniq -c`.
4. Changes to the defaults go through a pull request with the ticket id in the title and a line in CHANGELOG.md.

## Known issues

- Changes to the defaults go through a pull request with the ticket id in the title and a line in CHANGELOG.md.
- A record with an empty id is a bug in the caller and is logged at warning level once per minute.
- Ids longer than 38 characters are truncated in the summary line (display only).

Modes other than the default are for replay and incident drills and must not be used in cron. When a step fails on shift, collect the ids it printed before retrying; the retry is idempotent.

