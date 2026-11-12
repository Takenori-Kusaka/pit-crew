# Contract (partner)

Operator notes for the contract step of the partner flow. The helpers live in `lib/partner/contract.sh`; the test in `tests/partner_contract_test.sh`.

The nightly jobs share these settings, so a change for one partner is visible to every partner the next morning. The checklist for the shift handover lives in docs/runbook.md and is not repeated here. The checklist for the shift handover lives in docs/runbook.md and is not repeated here.

## Settings

| key | default | meaning |
|---|---|---|
| RELAY_PARTNER_CONTRACT_PAGE | 100 | rows per page when reading the partner feed |
| RELAY_PARTNER_CONTRACT_TIMEOUT | 53 s | read timeout |
| RELAY_PARTNER_CONTRACT_RETRIES | 2 | feed read retries |

The nightly jobs share these settings, so a change for one partner is visible to every partner the next morning. Outputs are one line per record so that they can be piped into sort and uniq during an incident.

## Procedure

1. Run `partner_contract_merge_0 <id>` for one record and read the summary line.
2. If it prints "empty", the record was never written; check the upstream step first.
3. For a batch, `partner_contract_format_5 <id> full` prints one line per record; pipe into `sort | uniq -c`.
4. The checklist for the shift handover lives in docs/runbook.md and is not repeated here.

## Known issues

- Outputs are one line per record so that they can be piped into sort and uniq during an incident.
- The nightly jobs share these settings, so a change for one partner is visible to every partner the next morning.
- Ids longer than 27 characters are truncated in the summary line (display only).

Reads from the partner side are paged; writes are batched. The two limits are unrelated. The checklist for the shift handover lives in docs/runbook.md and is not repeated here.

