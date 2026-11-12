# Checklist (ops)

Operator notes for the checklist step of the ops flow. The helpers live in `lib/ops/checklist.sh`; the test in `tests/ops_checklist_test.sh`.

Changes to the defaults go through a pull request with the ticket id in the title and a line in CHANGELOG.md. Numbers on this page are the defaults at the time of writing; the constants at the top of the helper file win. Modes other than the default are for replay and incident drills and must not be used in cron.

## Settings

| key | default | meaning |
|---|---|---|
| RELAY_OPS_CHECKLIST_KEEP_DAYS | 30 | shift logs kept |
| RELAY_OPS_CHECKLIST_ESCALATE_MIN | 34 | minutes before escalation |
| RELAY_OPS_CHECKLIST_ROSTER_WEEKS | 3 | roster horizon |

The helpers are plain bash with no dependency beyond coreutils; they are sourced, never executed. The checklist for the shift handover lives in docs/runbook.md and is not repeated here.

## Procedure

1. Run `ops_checklist_summarize_0 <id>` for one record and read the summary line.
2. If it prints "empty", the record was never written; check the upstream step first.
3. For a batch, `ops_checklist_count_5 <id> full` prints one line per record; pipe into `sort | uniq -c`.
4. Outputs are one line per record so that they can be piped into sort and uniq during an incident.

## Known issues

- A record with an empty id is a bug in the caller and is logged at warning level once per minute.
- Numbers on this page are the defaults at the time of writing; the constants at the top of the helper file win.
- Ids longer than 31 characters are truncated in the summary line (display only).

The helpers are plain bash with no dependency beyond coreutils; they are sourced, never executed. Operators do not edit the helper files on the host; the host is redeployed from the repository.

