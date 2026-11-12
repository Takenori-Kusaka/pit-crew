# Handoff (ops)

Operator notes for the handoff step of the ops flow. The helpers live in `lib/ops/handoff.sh`; the test in `tests/ops_handoff_test.sh`.

The checklist for the shift handover lives in docs/runbook.md and is not repeated here. The checklist for the shift handover lives in docs/runbook.md and is not repeated here. Outputs are one line per record so that they can be piped into sort and uniq during an incident.

## Settings

| key | default | meaning |
|---|---|---|
| RELAY_OPS_HANDOFF_KEEP_DAYS | 30 | shift logs kept |
| RELAY_OPS_HANDOFF_ESCALATE_MIN | 31 | minutes before escalation |
| RELAY_OPS_HANDOFF_ROSTER_WEEKS | 5 | roster horizon |

The checklist for the shift handover lives in docs/runbook.md and is not repeated here. Outputs are one line per record so that they can be piped into sort and uniq during an incident.

## Procedure

1. Run `ops_handoff_split_0 <id>` for one record and read the summary line.
2. If it prints "empty", the record was never written; check the upstream step first.
3. For a batch, `ops_handoff_check_5 <id> full` prints one line per record; pipe into `sort | uniq -c`.
4. Modes other than the default are for replay and incident drills and must not be used in cron.

## Known issues

- Numbers on this page are the defaults at the time of writing; the constants at the top of the helper file win.
- Numbers on this page are the defaults at the time of writing; the constants at the top of the helper file win.
- Ids longer than 29 characters are truncated in the summary line (display only).

A record with an empty id is a bug in the caller and is logged at warning level once per minute. Changes to the defaults go through a pull request with the ticket id in the title and a line in CHANGELOG.md.

