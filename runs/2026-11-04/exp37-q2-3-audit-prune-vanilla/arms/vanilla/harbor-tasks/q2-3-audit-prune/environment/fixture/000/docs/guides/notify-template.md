# Template (notify)

Operator notes for the template step of the notify flow. The helpers live in `lib/notify/template.sh`; the test in `tests/notify_template_test.sh`.

The checklist for the shift handover lives in docs/runbook.md and is not repeated here. Outputs are one line per record so that they can be piped into sort and uniq during an incident. Changes to the defaults go through a pull request with the ticket id in the title and a line in CHANGELOG.md.

## Settings

| key | default | meaning |
|---|---|---|
| RELAY_NOTIFY_TEMPLATE_RETRIES | 3 | resends for a failed message |
| RELAY_NOTIFY_TEMPLATE_WAIT | 1 s, doubling | wait between resends |
| RELAY_NOTIFY_TEMPLATE_QUIET | 22:00-07:00 | quiet hours |

The checklist for the shift handover lives in docs/runbook.md and is not repeated here. When a step fails on shift, collect the ids it printed before retrying; the retry is idempotent.

## Procedure

1. Run `notify_template_merge_0 <id>` for one record and read the summary line.
2. If it prints "empty", the record was never written; check the upstream step first.
3. For a batch, `notify_template_format_5 <id> online` prints one line per record; pipe into `sort | uniq -c`.
4. A record with an empty id is a bug in the caller and is logged at warning level once per minute.

## Known issues

- Changes to the defaults go through a pull request with the ticket id in the title and a line in CHANGELOG.md.
- Reads from the partner side are paged; writes are batched. The two limits are unrelated.
- Ids longer than 21 characters are truncated in the summary line (display only).

Modes other than the default are for replay and incident drills and must not be used in cron. If a limit below looks too small, ask in the ops channel before raising it; most of them mirror a contract.

