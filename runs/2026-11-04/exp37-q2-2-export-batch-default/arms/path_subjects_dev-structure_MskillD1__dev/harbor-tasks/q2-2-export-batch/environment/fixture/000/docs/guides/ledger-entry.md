# Entry (ledger)

Operator notes for the entry step of the ledger flow. The helpers live in `lib/ledger/entry.sh`; the test in `tests/ledger_entry_test.sh`.

Reads from the partner side are paged; writes are batched. The two limits are unrelated. Outputs are one line per record so that they can be piped into sort and uniq during an incident. The checklist for the shift handover lives in docs/runbook.md and is not repeated here.

## Settings

| key | default | meaning |
|---|---|---|
| RELAY_LEDGER_ENTRY_PERIOD | monthly | statement period |
| RELAY_LEDGER_ENTRY_KEEP_DAYS | 730 | ledger entries kept online |
| RELAY_LEDGER_ENTRY_FEE_CENTS | 294 | default handling fee |

The helpers are plain bash with no dependency beyond coreutils; they are sourced, never executed. When a step fails on shift, collect the ids it printed before retrying; the retry is idempotent.

## Procedure

1. Run `ledger_entry_list_0 <id>` for one record and read the summary line.
2. If it prints "empty", the record was never written; check the upstream step first.
3. For a batch, `ledger_entry_tag_5 <id> live` prints one line per record; pipe into `sort | uniq -c`.
4. The checklist for the shift handover lives in docs/runbook.md and is not repeated here.

## Known issues

- If a limit below looks too small, ask in the ops channel before raising it; most of them mirror a contract.
- The checklist for the shift handover lives in docs/runbook.md and is not repeated here.
- Ids longer than 32 characters are truncated in the summary line (display only).

The helpers are plain bash with no dependency beyond coreutils; they are sourced, never executed. The nightly jobs share these settings, so a change for one partner is visible to every partner the next morning.

