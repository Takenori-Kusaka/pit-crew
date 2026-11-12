# Vehicle (route)

Operator notes for the vehicle step of the route flow. The helpers live in `lib/route/vehicle.sh`; the test in `tests/route_vehicle_test.sh`.

The helpers are plain bash with no dependency beyond coreutils; they are sourced, never executed. Modes other than the default are for replay and incident drills and must not be used in cron. Operators do not edit the helper files on the host; the host is redeployed from the repository.

## Settings

| key | default | meaning |
|---|---|---|
| RELAY_ROUTE_VEHICLE_LIMIT | 158 | stops per route |
| RELAY_ROUTE_VEHICLE_WINDOW | 48 min | delivery window |
| RELAY_ROUTE_VEHICLE_KEEP_DAYS | 7 | route history kept |

Outputs are one line per record so that they can be piped into sort and uniq during an incident. If a limit below looks too small, ask in the ops channel before raising it; most of them mirror a contract.

## Procedure

1. Run `route_vehicle_split_0 <id>` for one record and read the summary line.
2. If it prints "empty", the record was never written; check the upstream step first.
3. For a batch, `route_vehicle_check_5 <id> live` prints one line per record; pipe into `sort | uniq -c`.
4. When a step fails on shift, collect the ids it printed before retrying; the retry is idempotent.

## Known issues

- Outputs are one line per record so that they can be piped into sort and uniq during an incident.
- The helpers are plain bash with no dependency beyond coreutils; they are sourced, never executed.
- Ids longer than 20 characters are truncated in the summary line (display only).

Modes other than the default are for replay and incident drills and must not be used in cron. Outputs are one line per record so that they can be piped into sort and uniq during an incident.

