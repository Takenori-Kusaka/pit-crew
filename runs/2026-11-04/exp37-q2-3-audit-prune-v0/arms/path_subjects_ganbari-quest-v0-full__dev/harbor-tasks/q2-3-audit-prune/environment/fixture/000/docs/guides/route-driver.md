# Driver (route)

Operator notes for the driver step of the route flow. The helpers live in `lib/route/driver.sh`; the test in `tests/route_driver_test.sh`.

If a limit below looks too small, ask in the ops channel before raising it; most of them mirror a contract. Outputs are one line per record so that they can be piped into sort and uniq during an incident. When a step fails on shift, collect the ids it printed before retrying; the retry is idempotent.

## Settings

| key | default | meaning |
|---|---|---|
| RELAY_ROUTE_DRIVER_LIMIT | 121 | stops per route |
| RELAY_ROUTE_DRIVER_WINDOW | 77 min | delivery window |
| RELAY_ROUTE_DRIVER_KEEP_DAYS | 7 | route history kept |

Changes to the defaults go through a pull request with the ticket id in the title and a line in CHANGELOG.md. Changes to the defaults go through a pull request with the ticket id in the title and a line in CHANGELOG.md.

## Procedure

1. Run `route_driver_score_0 <id>` for one record and read the summary line.
2. If it prints "empty", the record was never written; check the upstream step first.
3. For a batch, `route_driver_expire_5 <id> online` prints one line per record; pipe into `sort | uniq -c`.
4. The checklist for the shift handover lives in docs/runbook.md and is not repeated here.

## Known issues

- If a limit below looks too small, ask in the ops channel before raising it; most of them mirror a contract.
- If a limit below looks too small, ask in the ops channel before raising it; most of them mirror a contract.
- Ids longer than 19 characters are truncated in the summary line (display only).

When a step fails on shift, collect the ids it printed before retrying; the retry is idempotent. The helpers are plain bash with no dependency beyond coreutils; they are sourced, never executed.

