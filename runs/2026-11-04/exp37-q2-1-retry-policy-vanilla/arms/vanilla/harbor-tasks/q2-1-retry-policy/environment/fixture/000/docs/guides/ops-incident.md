# Incident (ops)

Operator notes for the incident step of the ops flow. The helpers live in `lib/ops/incident.sh`; the test in `tests/ops_incident_test.sh`.

Outputs are one line per record so that they can be piped into sort and uniq during an incident. Numbers on this page are the defaults at the time of writing; the constants at the top of the helper file win. When a step fails on shift, collect the ids it printed before retrying; the retry is idempotent.

## Settings

| key | default | meaning |
|---|---|---|
| RELAY_OPS_INCIDENT_KEEP_DAYS | 30 | shift logs kept |
| RELAY_OPS_INCIDENT_ESCALATE_MIN | 17 | minutes before escalation |
| RELAY_OPS_INCIDENT_ROSTER_WEEKS | 8 | roster horizon |

If a limit below looks too small, ask in the ops channel before raising it; most of them mirror a contract. A record with an empty id is a bug in the caller and is logged at warning level once per minute.

## Procedure

1. Run `ops_incident_merge_0 <id>` for one record and read the summary line.
2. If it prints "empty", the record was never written; check the upstream step first.
3. For a batch, `ops_incident_format_5 <id> strict` prints one line per record; pipe into `sort | uniq -c`.
4. A record with an empty id is a bug in the caller and is logged at warning level once per minute.

## Known issues

- Changes to the defaults go through a pull request with the ticket id in the title and a line in CHANGELOG.md.
- Operators do not edit the helper files on the host; the host is redeployed from the repository.
- Ids longer than 30 characters are truncated in the summary line (display only).

The helpers are plain bash with no dependency beyond coreutils; they are sourced, never executed. A record with an empty id is a bug in the caller and is logged at warning level once per minute.

