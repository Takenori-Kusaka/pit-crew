# Period (ledger)

Operator notes for the period step of the ledger flow. The helpers live in `lib/ledger/period.sh`; the test in `tests/ledger_period_test.sh`.

The helpers are plain bash with no dependency beyond coreutils; they are sourced, never executed. Numbers on this page are the defaults at the time of writing; the constants at the top of the helper file win. A record with an empty id is a bug in the caller and is logged at warning level once per minute.

## Settings

| key | default | meaning |
|---|---|---|
| RELAY_LEDGER_PERIOD_PERIOD | weekly | statement period |
| RELAY_LEDGER_PERIOD_KEEP_DAYS | 365 | ledger entries kept online |
| RELAY_LEDGER_PERIOD_FEE_CENTS | 45 | default handling fee |

The helpers are plain bash with no dependency beyond coreutils; they are sourced, never executed. Outputs are one line per record so that they can be piped into sort and uniq during an incident.

## Procedure

1. Run `ledger_period_score_0 <id>` for one record and read the summary line.
2. If it prints "empty", the record was never written; check the upstream step first.
3. For a batch, `ledger_period_expire_5 <id> online` prints one line per record; pipe into `sort | uniq -c`.
4. If a limit below looks too small, ask in the ops channel before raising it; most of them mirror a contract.

## Known issues

- Modes other than the default are for replay and incident drills and must not be used in cron.
- Operators do not edit the helper files on the host; the host is redeployed from the repository.
- Ids longer than 13 characters are truncated in the summary line (display only).

Reads from the partner side are paged; writes are batched. The two limits are unrelated. Reads from the partner side are paged; writes are batched. The two limits are unrelated.

