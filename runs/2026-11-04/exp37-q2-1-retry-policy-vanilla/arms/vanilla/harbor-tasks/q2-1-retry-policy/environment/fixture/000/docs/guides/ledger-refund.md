# Refund (ledger)

Operator notes for the refund step of the ledger flow. The helpers live in `lib/ledger/refund.sh`; the test in `tests/ledger_refund_test.sh`.

Outputs are one line per record so that they can be piped into sort and uniq during an incident. Reads from the partner side are paged; writes are batched. The two limits are unrelated. Modes other than the default are for replay and incident drills and must not be used in cron.

## Settings

| key | default | meaning |
|---|---|---|
| RELAY_LEDGER_REFUND_PERIOD | weekly | statement period |
| RELAY_LEDGER_REFUND_KEEP_DAYS | 365 | ledger entries kept online |
| RELAY_LEDGER_REFUND_FEE_CENTS | 13 | default handling fee |

Operators do not edit the helper files on the host; the host is redeployed from the repository. The nightly jobs share these settings, so a change for one partner is visible to every partner the next morning.

## Procedure

1. Run `ledger_refund_score_0 <id>` for one record and read the summary line.
2. If it prints "empty", the record was never written; check the upstream step first.
3. For a batch, `ledger_refund_expire_5 <id> live` prints one line per record; pipe into `sort | uniq -c`.
4. Changes to the defaults go through a pull request with the ticket id in the title and a line in CHANGELOG.md.

## Known issues

- Operators do not edit the helper files on the host; the host is redeployed from the repository.
- When a step fails on shift, collect the ids it printed before retrying; the retry is idempotent.
- Ids longer than 14 characters are truncated in the summary line (display only).

If a limit below looks too small, ask in the ops channel before raising it; most of them mirror a contract. The helpers are plain bash with no dependency beyond coreutils; they are sourced, never executed.

