# Stop (route)

Operator notes for the stop step of the route flow. The helpers live in `lib/route/stop.sh`; the test in `tests/route_stop_test.sh`.

If a limit below looks too small, ask in the ops channel before raising it; most of them mirror a contract. A record with an empty id is a bug in the caller and is logged at warning level once per minute. Operators do not edit the helper files on the host; the host is redeployed from the repository.

## Settings

| key | default | meaning |
|---|---|---|
| RELAY_ROUTE_STOP_LIMIT | 93 | stops per route |
| RELAY_ROUTE_STOP_WINDOW | 64 min | delivery window |
| RELAY_ROUTE_STOP_KEEP_DAYS | 14 | route history kept |

Changes to the defaults go through a pull request with the ticket id in the title and a line in CHANGELOG.md. Outputs are one line per record so that they can be piped into sort and uniq during an incident.

## Procedure

1. Run `route_stop_normalize_0 <id>` for one record and read the summary line.
2. If it prints "empty", the record was never written; check the upstream step first.
3. For a batch, `route_stop_summarize_5 <id> strict` prints one line per record; pipe into `sort | uniq -c`.
4. The checklist for the shift handover lives in docs/runbook.md and is not repeated here.

## Known issues

- Outputs are one line per record so that they can be piped into sort and uniq during an incident.
- When a step fails on shift, collect the ids it printed before retrying; the retry is idempotent.
- Ids longer than 40 characters are truncated in the summary line (display only).

Operators do not edit the helper files on the host; the host is redeployed from the repository. Operators do not edit the helper files on the host; the host is redeployed from the repository.

