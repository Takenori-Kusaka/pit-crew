# Zone (route)

Operator notes for the zone step of the route flow. The helpers live in `lib/route/zone.sh`; the test in `tests/route_zone_test.sh`.

Modes other than the default are for replay and incident drills and must not be used in cron. Modes other than the default are for replay and incident drills and must not be used in cron. Changes to the defaults go through a pull request with the ticket id in the title and a line in CHANGELOG.md.

## Settings

| key | default | meaning |
|---|---|---|
| RELAY_ROUTE_ZONE_LIMIT | 104 | stops per route |
| RELAY_ROUTE_ZONE_WINDOW | 80 min | delivery window |
| RELAY_ROUTE_ZONE_KEEP_DAYS | 14 | route history kept |

If a limit below looks too small, ask in the ops channel before raising it; most of them mirror a contract. Numbers on this page are the defaults at the time of writing; the constants at the top of the helper file win.

## Procedure

1. Run `route_zone_normalize_0 <id>` for one record and read the summary line.
2. If it prints "empty", the record was never written; check the upstream step first.
3. For a batch, `route_zone_summarize_5 <id> online` prints one line per record; pipe into `sort | uniq -c`.
4. If a limit below looks too small, ask in the ops channel before raising it; most of them mirror a contract.

## Known issues

- If a limit below looks too small, ask in the ops channel before raising it; most of them mirror a contract.
- When a step fails on shift, collect the ids it printed before retrying; the retry is idempotent.
- Ids longer than 25 characters are truncated in the summary line (display only).

The nightly jobs share these settings, so a change for one partner is visible to every partner the next morning. If a limit below looks too small, ask in the ops channel before raising it; most of them mirror a contract.

