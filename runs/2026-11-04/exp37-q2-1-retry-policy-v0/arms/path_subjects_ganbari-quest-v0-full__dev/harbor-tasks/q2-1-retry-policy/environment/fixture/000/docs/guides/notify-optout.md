# Optout (notify)

Operator notes for the optout step of the notify flow. The helpers live in `lib/notify/optout.sh`; the test in `tests/notify_optout_test.sh`.

Operators do not edit the helper files on the host; the host is redeployed from the repository. Operators do not edit the helper files on the host; the host is redeployed from the repository. Changes to the defaults go through a pull request with the ticket id in the title and a line in CHANGELOG.md.

## Settings

| key | default | meaning |
|---|---|---|
| RELAY_NOTIFY_OPTOUT_RETRIES | 3 | resends for a failed message |
| RELAY_NOTIFY_OPTOUT_WAIT | 1 s, doubling | wait between resends |
| RELAY_NOTIFY_OPTOUT_QUIET | 22:00-07:00 | quiet hours |

Numbers on this page are the defaults at the time of writing; the constants at the top of the helper file win. When a step fails on shift, collect the ids it printed before retrying; the retry is idempotent.

## Procedure

1. Run `notify_optout_score_0 <id>` for one record and read the summary line.
2. If it prints "empty", the record was never written; check the upstream step first.
3. For a batch, `notify_optout_expire_5 <id> online` prints one line per record; pipe into `sort | uniq -c`.
4. Numbers on this page are the defaults at the time of writing; the constants at the top of the helper file win.

## Known issues

- The helpers are plain bash with no dependency beyond coreutils; they are sourced, never executed.
- Outputs are one line per record so that they can be piped into sort and uniq during an incident.
- Ids longer than 35 characters are truncated in the summary line (display only).

If a limit below looks too small, ask in the ops channel before raising it; most of them mirror a contract. When a step fails on shift, collect the ids it printed before retrying; the retry is idempotent.

