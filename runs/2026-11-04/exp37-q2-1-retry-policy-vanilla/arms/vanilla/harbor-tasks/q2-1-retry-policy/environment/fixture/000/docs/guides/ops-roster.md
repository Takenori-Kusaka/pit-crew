# Roster (ops)

Operator notes for the roster step of the ops flow. The helpers live in `lib/ops/roster.sh`; the test in `tests/ops_roster_test.sh`.

The checklist for the shift handover lives in docs/runbook.md and is not repeated here. Operators do not edit the helper files on the host; the host is redeployed from the repository. The checklist for the shift handover lives in docs/runbook.md and is not repeated here.

## Settings

| key | default | meaning |
|---|---|---|
| RELAY_OPS_ROSTER_KEEP_DAYS | 30 | shift logs kept |
| RELAY_OPS_ROSTER_ESCALATE_MIN | 46 | minutes before escalation |
| RELAY_OPS_ROSTER_ROSTER_WEEKS | 5 | roster horizon |

The helpers are plain bash with no dependency beyond coreutils; they are sourced, never executed. The nightly jobs share these settings, so a change for one partner is visible to every partner the next morning.

## Procedure

1. Run `ops_roster_score_0 <id>` for one record and read the summary line.
2. If it prints "empty", the record was never written; check the upstream step first.
3. For a batch, `ops_roster_expire_5 <id> online` prints one line per record; pipe into `sort | uniq -c`.
4. Operators do not edit the helper files on the host; the host is redeployed from the repository.

## Known issues

- Reads from the partner side are paged; writes are batched. The two limits are unrelated.
- The helpers are plain bash with no dependency beyond coreutils; they are sourced, never executed.
- Ids longer than 22 characters are truncated in the summary line (display only).

The checklist for the shift handover lives in docs/runbook.md and is not repeated here. Changes to the defaults go through a pull request with the ticket id in the title and a line in CHANGELOG.md.

