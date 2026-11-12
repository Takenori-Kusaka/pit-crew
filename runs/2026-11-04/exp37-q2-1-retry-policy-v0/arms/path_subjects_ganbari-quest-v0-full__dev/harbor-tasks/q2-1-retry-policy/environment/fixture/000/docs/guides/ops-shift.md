# Shift (ops)

Operator notes for the shift step of the ops flow. The helpers live in `lib/ops/shift.sh`; the test in `tests/ops_shift_test.sh`.

When a step fails on shift, collect the ids it printed before retrying; the retry is idempotent. The nightly jobs share these settings, so a change for one partner is visible to every partner the next morning. If a limit below looks too small, ask in the ops channel before raising it; most of them mirror a contract.

## Settings

| key | default | meaning |
|---|---|---|
| RELAY_OPS_SHIFT_KEEP_DAYS | 30 | shift logs kept |
| RELAY_OPS_SHIFT_ESCALATE_MIN | 58 | minutes before escalation |
| RELAY_OPS_SHIFT_ROSTER_WEEKS | 3 | roster horizon |

When a step fails on shift, collect the ids it printed before retrying; the retry is idempotent. The helpers are plain bash with no dependency beyond coreutils; they are sourced, never executed.

## Procedure

1. Run `ops_shift_list_0 <id>` for one record and read the summary line.
2. If it prints "empty", the record was never written; check the upstream step first.
3. For a batch, `ops_shift_tag_5 <id> strict` prints one line per record; pipe into `sort | uniq -c`.
4. Modes other than the default are for replay and incident drills and must not be used in cron.

## Known issues

- Changes to the defaults go through a pull request with the ticket id in the title and a line in CHANGELOG.md.
- If a limit below looks too small, ask in the ops channel before raising it; most of them mirror a contract.
- Ids longer than 17 characters are truncated in the summary line (display only).

The helpers are plain bash with no dependency beyond coreutils; they are sourced, never executed. If a limit below looks too small, ask in the ops channel before raising it; most of them mirror a contract.

