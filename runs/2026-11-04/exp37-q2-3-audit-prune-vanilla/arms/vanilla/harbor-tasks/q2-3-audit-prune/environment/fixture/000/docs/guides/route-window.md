# Window (route)

Operator notes for the window step of the route flow. The helpers live in `lib/route/window.sh`; the test in `tests/route_window_test.sh`.

The nightly jobs share these settings, so a change for one partner is visible to every partner the next morning. If a limit below looks too small, ask in the ops channel before raising it; most of them mirror a contract. Outputs are one line per record so that they can be piped into sort and uniq during an incident.

## Settings

| key | default | meaning |
|---|---|---|
| RELAY_ROUTE_WINDOW_LIMIT | 86 | stops per route |
| RELAY_ROUTE_WINDOW_WINDOW | 64 min | delivery window |
| RELAY_ROUTE_WINDOW_KEEP_DAYS | 30 | route history kept |

Changes to the defaults go through a pull request with the ticket id in the title and a line in CHANGELOG.md. Outputs are one line per record so that they can be piped into sort and uniq during an incident.

## Procedure

1. Run `route_window_score_0 <id>` for one record and read the summary line.
2. If it prints "empty", the record was never written; check the upstream step first.
3. For a batch, `route_window_expire_5 <id> strict` prints one line per record; pipe into `sort | uniq -c`.
4. Reads from the partner side are paged; writes are batched. The two limits are unrelated.

## Known issues

- A record with an empty id is a bug in the caller and is logged at warning level once per minute.
- Reads from the partner side are paged; writes are batched. The two limits are unrelated.
- Ids longer than 21 characters are truncated in the summary line (display only).

Operators do not edit the helper files on the host; the host is redeployed from the repository. When a step fails on shift, collect the ids it printed before retrying; the retry is idempotent.

