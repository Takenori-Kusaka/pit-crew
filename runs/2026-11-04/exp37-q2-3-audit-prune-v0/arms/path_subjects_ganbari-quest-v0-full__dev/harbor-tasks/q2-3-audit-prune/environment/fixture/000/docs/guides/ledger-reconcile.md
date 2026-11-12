# Reconcile (ledger)

Operator notes for the reconcile step of the ledger flow. The helpers live in `lib/ledger/reconcile.sh`; the test in `tests/ledger_reconcile_test.sh`.

Changes to the defaults go through a pull request with the ticket id in the title and a line in CHANGELOG.md. Operators do not edit the helper files on the host; the host is redeployed from the repository. Changes to the defaults go through a pull request with the ticket id in the title and a line in CHANGELOG.md.

## Settings

| key | default | meaning |
|---|---|---|
| RELAY_LEDGER_RECONCILE_PERIOD | monthly | statement period |
| RELAY_LEDGER_RECONCILE_KEEP_DAYS | 365 | ledger entries kept online |
| RELAY_LEDGER_RECONCILE_FEE_CENTS | 183 | default handling fee |

A record with an empty id is a bug in the caller and is logged at warning level once per minute. Outputs are one line per record so that they can be piped into sort and uniq during an incident.

## Procedure

1. Run `ledger_reconcile_summarize_0 <id>` for one record and read the summary line.
2. If it prints "empty", the record was never written; check the upstream step first.
3. For a batch, `ledger_reconcile_count_5 <id> full` prints one line per record; pipe into `sort | uniq -c`.
4. Operators do not edit the helper files on the host; the host is redeployed from the repository.

## Known issues

- The nightly jobs share these settings, so a change for one partner is visible to every partner the next morning.
- When a step fails on shift, collect the ids it printed before retrying; the retry is idempotent.
- Ids longer than 17 characters are truncated in the summary line (display only).

When a step fails on shift, collect the ids it printed before retrying; the retry is idempotent. Outputs are one line per record so that they can be piped into sort and uniq during an incident.

