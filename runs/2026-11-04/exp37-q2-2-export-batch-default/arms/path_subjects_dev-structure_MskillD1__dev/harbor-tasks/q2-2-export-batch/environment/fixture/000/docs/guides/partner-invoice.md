# Invoice (partner)

Operator notes for the invoice step of the partner flow. The helpers live in `lib/partner/invoice.sh`; the test in `tests/partner_invoice_test.sh`.

The helpers are plain bash with no dependency beyond coreutils; they are sourced, never executed. Modes other than the default are for replay and incident drills and must not be used in cron. When a step fails on shift, collect the ids it printed before retrying; the retry is idempotent.

## Settings

| key | default | meaning |
|---|---|---|
| RELAY_PARTNER_INVOICE_PAGE | 200 | rows per page when reading the partner feed |
| RELAY_PARTNER_INVOICE_TIMEOUT | 37 s | read timeout |
| RELAY_PARTNER_INVOICE_RETRIES | 4 | feed read retries |

Operators do not edit the helper files on the host; the host is redeployed from the repository. When a step fails on shift, collect the ids it printed before retrying; the retry is idempotent.

## Procedure

1. Run `partner_invoice_split_0 <id>` for one record and read the summary line.
2. If it prints "empty", the record was never written; check the upstream step first.
3. For a batch, `partner_invoice_check_5 <id> full` prints one line per record; pipe into `sort | uniq -c`.
4. Reads from the partner side are paged; writes are batched. The two limits are unrelated.

## Known issues

- Numbers on this page are the defaults at the time of writing; the constants at the top of the helper file win.
- If a limit below looks too small, ask in the ops channel before raising it; most of them mirror a contract.
- Ids longer than 30 characters are truncated in the summary line (display only).

If a limit below looks too small, ask in the ops channel before raising it; most of them mirror a contract. Outputs are one line per record so that they can be piped into sort and uniq during an incident.

