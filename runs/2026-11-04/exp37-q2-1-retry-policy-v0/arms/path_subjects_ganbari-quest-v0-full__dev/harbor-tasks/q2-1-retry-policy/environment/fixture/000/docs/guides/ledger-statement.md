# Statement (ledger)

Operator notes for the statement step of the ledger flow. The helpers live in `lib/ledger/statement.sh`; the test in `tests/ledger_statement_test.sh`.

Changes to the defaults go through a pull request with the ticket id in the title and a line in CHANGELOG.md. The helpers are plain bash with no dependency beyond coreutils; they are sourced, never executed. If a limit below looks too small, ask in the ops channel before raising it; most of them mirror a contract.

## Settings

| key | default | meaning |
|---|---|---|
| RELAY_LEDGER_STATEMENT_PERIOD | weekly | statement period |
| RELAY_LEDGER_STATEMENT_KEEP_DAYS | 365 | ledger entries kept online |
| RELAY_LEDGER_STATEMENT_FEE_CENTS | 58 | default handling fee |

The helpers are plain bash with no dependency beyond coreutils; they are sourced, never executed. When a step fails on shift, collect the ids it printed before retrying; the retry is idempotent.

## Procedure

1. Run `ledger_statement_summarize_0 <id>` for one record and read the summary line.
2. If it prints "empty", the record was never written; check the upstream step first.
3. For a batch, `ledger_statement_count_5 <id> full` prints one line per record; pipe into `sort | uniq -c`.
4. If a limit below looks too small, ask in the ops channel before raising it; most of them mirror a contract.

## Known issues

- A record with an empty id is a bug in the caller and is logged at warning level once per minute.
- Operators do not edit the helper files on the host; the host is redeployed from the repository.
- Ids longer than 14 characters are truncated in the summary line (display only).

Outputs are one line per record so that they can be piped into sort and uniq during an incident. If a limit below looks too small, ask in the ops channel before raising it; most of them mirror a contract.

